package record

import (
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/roblox-studio-mcp/studio-capture/internal/capture"
	"golang.org/x/sys/windows"
)

// RecordingStatus represents the state of a recording.
type RecordingStatus string

const (
	StatusRecording RecordingStatus = "recording"
	StatusStopped   RecordingStatus = "stopped"
	StatusError     RecordingStatus = "error"
)

// QualityPreset maps quality names to CRF values.
var QualityPreset = map[string]int{
	"low":    35,
	"medium": 28,
	"high":   20,
}

// RecordingConfig holds settings for a recording session.
type RecordingConfig struct {
	MaxDurationSeconds int
	FPS                int
	Quality            string
}

// RecordingState tracks the state of an active or completed recording.
type RecordingState struct {
	ID              string
	Status          RecordingStatus
	StartTime       time.Time
	StopTime        time.Time
	OutputPath      string
	Width           int
	Height          int
	FPS             int
	Error           string
	FrameCount      int
	stopCh          chan struct{}
	ffmpegCmd       *exec.Cmd
	ffmpegStdin     io.WriteCloser
	mu              sync.Mutex
}

// Recorder manages active recordings.
type Recorder struct {
	mu         sync.Mutex
	recordings map[string]*RecordingState
}

// NewRecorder creates a new Recorder instance.
func NewRecorder() *Recorder {
	return &Recorder{
		recordings: make(map[string]*RecordingState),
	}
}

// FindFFmpeg locates the ffmpeg binary.
func FindFFmpeg() (string, error) {
	// Check PATH first
	path, err := exec.LookPath("ffmpeg")
	if err == nil {
		return path, nil
	}

	// Check ~/.studio-capture/ffmpeg.exe
	home, _ := os.UserHomeDir()
	if home != "" {
		customPath := filepath.Join(home, ".studio-capture", "ffmpeg.exe")
		if _, err := os.Stat(customPath); err == nil {
			return customPath, nil
		}
	}

	// Check next to the executable
	exePath, _ := os.Executable()
	if exePath != "" {
		bundledPath := filepath.Join(filepath.Dir(exePath), "ffmpeg.exe")
		if _, err := os.Stat(bundledPath); err == nil {
			return bundledPath, nil
		}
	}

	return "", fmt.Errorf("FFmpeg not found. Install FFmpeg and add it to PATH, or place ffmpeg.exe in ~/.studio-capture/")
}

// StartRecording begins capturing frames from the Roblox Studio window.
func (r *Recorder) StartRecording(config RecordingConfig) (string, error) {
	// Validate config
	if config.MaxDurationSeconds <= 0 {
		config.MaxDurationSeconds = 10
	}
	if config.MaxDurationSeconds > 30 {
		config.MaxDurationSeconds = 30
	}
	if config.FPS <= 0 {
		config.FPS = 15
	}
	if config.FPS > 30 {
		config.FPS = 30
	}
	if config.Quality == "" {
		config.Quality = "medium"
	}

	// Find FFmpeg
	ffmpegPath, err := FindFFmpeg()
	if err != nil {
		return "", err
	}

	// Find studio window
	hwnd, err := capture.FindStudioWindow()
	if err != nil {
		return "", err
	}

	// Get initial frame to determine dimensions
	_, width, height, err := capture.CaptureRawFrames(hwnd)
	if err != nil {
		return "", fmt.Errorf("failed to capture initial frame: %w", err)
	}

	// Generate recording ID
	recordingID := fmt.Sprintf("rec_%d", time.Now().UnixNano())

	// Create temp output file
	outputPath := filepath.Join(os.TempDir(), recordingID+".mp4")

	// Get CRF value
	crf := QualityPreset[config.Quality]
	if crf == 0 {
		crf = 28
	}

	// Start FFmpeg process
	ffmpegCmd := exec.Command(ffmpegPath,
		"-f", "rawvideo",
		"-pix_fmt", "bgra",
		"-s", fmt.Sprintf("%dx%d", width, height),
		"-r", fmt.Sprintf("%d", config.FPS),
		"-i", "pipe:0",
		"-c:v", "libx264",
		"-preset", "ultrafast",
		"-crf", fmt.Sprintf("%d", crf),
		"-pix_fmt", "yuv420p",
		"-movflags", "+faststart",
		"-y", outputPath,
	)

	ffmpegStdin, err := ffmpegCmd.StdinPipe()
	if err != nil {
		return "", fmt.Errorf("failed to create ffmpeg stdin pipe: %w", err)
	}

	// Suppress FFmpeg output
	ffmpegCmd.Stdout = nil
	ffmpegCmd.Stderr = nil

	if err := ffmpegCmd.Start(); err != nil {
		return "", fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	state := &RecordingState{
		ID:          recordingID,
		Status:      StatusRecording,
		StartTime:   time.Now(),
		OutputPath:  outputPath,
		Width:       width,
		Height:      height,
		FPS:         config.FPS,
		stopCh:      make(chan struct{}),
		ffmpegCmd:   ffmpegCmd,
		ffmpegStdin: ffmpegStdin,
	}

	r.mu.Lock()
	r.recordings[recordingID] = state
	r.mu.Unlock()

	// Start capture goroutine
	go r.captureLoop(state, hwnd, config)

	return recordingID, nil
}

// captureLoop runs in a goroutine, capturing frames at the specified FPS.
func (r *Recorder) captureLoop(state *RecordingState, hwnd windows.HWND, config RecordingConfig) {
	frameInterval := time.Duration(float64(time.Second) / float64(config.FPS))
	maxDuration := time.Duration(config.MaxDurationSeconds) * time.Second
	ticker := time.NewTicker(frameInterval)
	defer ticker.Stop()

	timeout := time.After(maxDuration)

	for {
		select {
		case <-state.stopCh:
			r.finishRecording(state)
			return
		case <-timeout:
			r.finishRecording(state)
			return
		case <-ticker.C:
			pixelData, w, h, err := capture.CaptureRawFrames(hwnd)
			if err != nil {
				state.mu.Lock()
				state.Status = StatusError
				state.Error = fmt.Sprintf("frame capture failed: %v", err)
				state.mu.Unlock()
				r.finishRecording(state)
				return
			}

			// If dimensions changed, skip frame
			if w != state.Width || h != state.Height {
				continue
			}

			_, err = state.ffmpegStdin.Write(pixelData)
			if err != nil {
				state.mu.Lock()
				state.Status = StatusError
				state.Error = fmt.Sprintf("ffmpeg write failed: %v", err)
				state.mu.Unlock()
				r.finishRecording(state)
				return
			}

			state.mu.Lock()
			state.FrameCount++
			state.mu.Unlock()
		}
	}
}

// finishRecording closes FFmpeg stdin and waits for encoding to complete.
func (r *Recorder) finishRecording(state *RecordingState) {
	state.ffmpegStdin.Close()
	state.ffmpegCmd.Wait()

	state.mu.Lock()
	if state.Status != StatusError {
		state.Status = StatusStopped
	}
	state.StopTime = time.Now()
	state.mu.Unlock()
}

// StopRecording stops an active recording and returns the result.
func (r *Recorder) StopRecording(recordingID string) (string, float64, int64, error) {
	r.mu.Lock()
	state, ok := r.recordings[recordingID]
	r.mu.Unlock()

	if !ok {
		return "", 0, 0, fmt.Errorf("recording not found: %s", recordingID)
	}

	state.mu.Lock()
	status := state.Status
	state.mu.Unlock()

	if status == StatusRecording {
		close(state.stopCh)
		// Wait for recording to finish
		for i := 0; i < 100; i++ {
			time.Sleep(100 * time.Millisecond)
			state.mu.Lock()
			s := state.Status
			state.mu.Unlock()
			if s != StatusRecording {
				break
			}
		}
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	if state.Status == StatusError {
		return "", 0, 0, fmt.Errorf("recording error: %s", state.Error)
	}

	// Read the output file
	data, err := os.ReadFile(state.OutputPath)
	if err != nil {
		return "", 0, 0, fmt.Errorf("failed to read output file: %w", err)
	}

	// Clean up temp file
	os.Remove(state.OutputPath)

	duration := state.StopTime.Sub(state.StartTime).Seconds()
	videoBase64 := base64.StdEncoding.EncodeToString(data)

	return videoBase64, duration, int64(len(data)), nil
}

// GetStatus returns the current status of a recording.
func (r *Recorder) GetStatus(recordingID string) (RecordingStatus, float64, int64, error) {
	r.mu.Lock()
	state, ok := r.recordings[recordingID]
	r.mu.Unlock()

	if !ok {
		return "", 0, 0, fmt.Errorf("recording not found: %s", recordingID)
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	elapsed := time.Since(state.StartTime).Seconds()
	if state.Status == StatusStopped {
		elapsed = state.StopTime.Sub(state.StartTime).Seconds()
	}

	// Estimate size: frames * width * height * 4 bytes per pixel, compressed ~50x
	estimatedSize := int64(state.FrameCount) * int64(state.Width) * int64(state.Height) * 4 / 50

	return state.Status, elapsed, estimatedSize, nil
}
