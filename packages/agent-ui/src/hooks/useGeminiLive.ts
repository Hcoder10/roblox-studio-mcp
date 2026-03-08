import { useCallback, useEffect, useRef, useState } from 'react';

export function useGeminiLive(wsUrl: string) {
  const [isLive, setIsLive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const startLive = useCallback(async () => {
    try {
      // Connect WebSocket for live session
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'live_start' }));
        setIsLive(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'live_transcript') {
            setTranscript(data.payload?.text ?? '');
          } else if (data.type === 'live_audio') {
            setIsSpeaking(true);
            // Play audio response
            playAudioChunk(data.payload?.audio);
          } else if (data.type === 'live_audio_end') {
            setIsSpeaking(false);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsLive(false);
        cleanup();
      };

      // Set up microphone capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          e.data.arrayBuffer().then((buffer) => {
            ws.send(buffer);
          });
        }
      };

      mediaRecorder.start(250); // Send chunks every 250ms
      setIsListening(true);
    } catch {
      setIsLive(false);
      cleanup();
    }
  }, [wsUrl, cleanup]);

  const stopLive = useCallback(() => {
    cleanup();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'live_stop' }));
      wsRef.current.close();
    }
    wsRef.current = null;
    setIsLive(false);
    setTranscript('');
  }, [cleanup]);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'live_text', payload: { text } }));
    }
  }, []);

  // Get analyser for waveform visualization
  const getAnalyser = useCallback(() => analyserRef.current, []);

  useEffect(() => {
    return () => {
      cleanup();
      wsRef.current?.close();
    };
  }, [cleanup]);

  return {
    isLive,
    isListening,
    isSpeaking,
    transcript,
    startLive,
    stopLive,
    sendText,
    getAnalyser,
  };
}

function playAudioChunk(base64Audio?: string) {
  if (!base64Audio) return;
  try {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(() => {});
  } catch {
    // ignore audio playback errors
  }
}
