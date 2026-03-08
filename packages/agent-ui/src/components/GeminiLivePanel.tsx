import { useCallback, useEffect, useRef, useState } from 'react';

interface GeminiLivePanelProps {
  isLive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
  onSendText: (text: string) => void;
  getAnalyser: () => AnalyserNode | null;
}

export function GeminiLivePanel({
  isLive,
  isListening,
  isSpeaking,
  transcript,
  onStart,
  onStop,
  onSendText,
  getAnalyser,
}: GeminiLivePanelProps) {
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Waveform visualization
  useEffect(() => {
    if (!isLive || !isListening) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      const analyser = getAnalyser();
      if (!analyser || !ctx || !canvas) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = isSpeaking
        ? 'rgba(46, 204, 113, 0.8)'
        : 'rgba(74, 158, 255, 0.8)';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i]! / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isLive, isListening, isSpeaking, getAnalyser]);

  const handleTextSend = useCallback(() => {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setTextInput('');
  }, [textInput, onSendText]);

  return (
    <div className="gemini-live-panel">
      <div className="panel-header">
        Gemini Live
        {isLive && <span className="live-badge">LIVE</span>}
      </div>

      <div className="gemini-live-body">
        {/* Mode toggle */}
        <div className="live-mode-toggle">
          <button
            className={`live-mode-btn ${mode === 'voice' ? 'active' : ''}`}
            onClick={() => setMode('voice')}
          >
            Voice
          </button>
          <button
            className={`live-mode-btn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            Text
          </button>
        </div>

        {mode === 'voice' ? (
          <div className="live-voice-section">
            {/* Mic button */}
            <button
              className={`mic-btn ${isLive ? 'mic-active' : ''} ${isSpeaking ? 'mic-speaking' : ''}`}
              onClick={isLive ? onStop : onStart}
            >
              <svg viewBox="0 0 24 24" className="mic-icon">
                {isLive ? (
                  // Stop icon
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                ) : (
                  // Mic icon
                  <>
                    <path
                      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                      fill="currentColor"
                    />
                    <path
                      d="M19 10v2a7 7 0 0 1-14 0v-2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <line
                      x1="12" y1="19" x2="12" y2="23"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="8" y1="23" x2="16" y2="23"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>

            {/* Status text */}
            <div className="live-status-text">
              {!isLive && 'Click to start voice session'}
              {isLive && isListening && !isSpeaking && 'Listening...'}
              {isLive && isSpeaking && 'Speaking...'}
            </div>

            {/* Waveform canvas */}
            {isLive && (
              <canvas
                ref={canvasRef}
                className="waveform-canvas"
                width={400}
                height={80}
              />
            )}

            {/* Vibe coding indicator */}
            {isLive && (
              <div className="vibe-coding-indicator">
                <span className="vibe-dot" />
                Vibe Coding Mode
              </div>
            )}
          </div>
        ) : (
          <div className="live-text-section">
            <textarea
              className="live-text-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleTextSend();
                }
              }}
              placeholder="Type a message for Gemini Live..."
              rows={3}
            />
            <button
              className="live-text-send"
              onClick={handleTextSend}
              disabled={!textInput.trim() || !isLive}
            >
              Send
            </button>
            {!isLive && (
              <button className="live-connect-btn" onClick={onStart}>
                Connect to Live Session
              </button>
            )}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="live-transcript">
            <div className="live-transcript-label">Transcript</div>
            <div className="live-transcript-text">{transcript}</div>
          </div>
        )}
      </div>
    </div>
  );
}
