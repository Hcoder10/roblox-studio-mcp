package tools

import (
	"context"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/roblox-studio-mcp/studio-capture/internal/record"
)

// Global recorder instance shared across tool calls.
var recorder = record.NewRecorder()

// VideoRecordStartTool returns the tool definition for video_record_start.
func VideoRecordStartTool() mcp.Tool {
	return mcp.NewTool("video_record_start",
		mcp.WithDescription("Start recording the Roblox Studio window. Requires FFmpeg installed."),
		mcp.WithNumber("max_duration_seconds",
			mcp.Description("Maximum recording duration in seconds (default 10, max 30)"),
		),
		mcp.WithNumber("fps",
			mcp.Description("Frames per second (default 15, max 30)"),
		),
		mcp.WithString("quality",
			mcp.Description("Recording quality"),
			mcp.Enum("low", "medium", "high"),
		),
	)
}

// VideoRecordStartHandler handles video_record_start requests.
func VideoRecordStartHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	config := record.RecordingConfig{
		MaxDurationSeconds: 10,
		FPS:                15,
		Quality:            "medium",
	}

	if d, ok := request.Params.Arguments["max_duration_seconds"].(float64); ok && d > 0 {
		config.MaxDurationSeconds = int(d)
	}
	if f, ok := request.Params.Arguments["fps"].(float64); ok && f > 0 {
		config.FPS = int(f)
	}
	if q, ok := request.Params.Arguments["quality"].(string); ok && q != "" {
		config.Quality = q
	}

	recordingID, err := recorder.StartRecording(config)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to start recording: %v", err)), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"recording_id": "%s", "status": "recording"}`,
		recordingID,
	)), nil
}

// VideoRecordStopTool returns the tool definition for video_record_stop.
func VideoRecordStopTool() mcp.Tool {
	return mcp.NewTool("video_record_stop",
		mcp.WithDescription("Stop an active recording and get the result as base64 MP4"),
		mcp.WithString("recording_id",
			mcp.Required(),
			mcp.Description("The recording ID returned by video_record_start"),
		),
	)
}

// VideoRecordStopHandler handles video_record_stop requests.
func VideoRecordStopHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	recordingID, ok := request.Params.Arguments["recording_id"].(string)
	if !ok || recordingID == "" {
		return mcp.NewToolResultError("recording_id is required"), nil
	}

	videoBase64, duration, fileSize, err := recorder.StopRecording(recordingID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to stop recording: %v", err)), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"video_base64": "%s", "duration_seconds": %.2f, "file_size_bytes": %d, "format": "mp4"}`,
		videoBase64, duration, fileSize,
	)), nil
}

// VideoGetStatusTool returns the tool definition for video_get_status.
func VideoGetStatusTool() mcp.Tool {
	return mcp.NewTool("video_get_status",
		mcp.WithDescription("Check status of a recording"),
		mcp.WithString("recording_id",
			mcp.Required(),
			mcp.Description("The recording ID returned by video_record_start"),
		),
	)
}

// VideoGetStatusHandler handles video_get_status requests.
func VideoGetStatusHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	recordingID, ok := request.Params.Arguments["recording_id"].(string)
	if !ok || recordingID == "" {
		return mcp.NewToolResultError("recording_id is required"), nil
	}

	status, elapsed, estimatedSize, err := recorder.GetStatus(recordingID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to get status: %v", err)), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"status": "%s", "elapsed_seconds": %.2f, "estimated_size_bytes": %d}`,
		status, elapsed, estimatedSize,
	)), nil
}

// RegisterVideoTools registers all video tools with the MCP server.
func RegisterVideoTools(s *server.MCPServer) {
	s.AddTool(VideoRecordStartTool(), VideoRecordStartHandler)
	s.AddTool(VideoRecordStopTool(), VideoRecordStopHandler)
	s.AddTool(VideoGetStatusTool(), VideoGetStatusHandler)
}
