import { useCallback, useEffect, useRef, useState } from 'react';
import type { WsEvent } from '../types';

const MAX_BACKOFF_MS = 30_000;

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<unknown[]>([]);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    clearTimeout(reconnectTimerRef.current);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      backoffRef.current = 1000;
      // Flush queued messages
      const queued = queueRef.current.splice(0);
      for (const msg of queued) {
        ws.send(JSON.stringify(msg));
      }
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const parsed = JSON.parse(event.data as string) as WsEvent;
        setLastEvent(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      wsRef.current = null;
      // Reconnect with exponential backoff
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // Avoid manually closing a CONNECTING socket.
      // The browser will transition to CLOSED and trigger onclose.
    };
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      queueRef.current.push(data);
    }
  }, []);

  return { connected, send, lastEvent };
}
