import { useEffect } from 'react';
import { config } from '../config';

interface UseTournamentSocketParams {
  code?: string;
  onMessage: (payload: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
  reconnectDelayMs?: number;
  enableReconnect?: boolean;
}

export function useTournamentSocket({
  code,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectDelayMs = 1500,
  enableReconnect = false,
}: UseTournamentSocketParams) {
  useEffect(() => {
    if (!code) return undefined;

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isUnmounted = false;

    const connect = () => {
      ws = new WebSocket(`${config.wsUrl}/ws/${code}`);
      ws.onopen = () => onOpen?.();
      ws.onmessage = (event) => onMessage(JSON.parse(event.data));
      ws.onerror = () => onError?.();
      ws.onclose = () => {
        onClose?.();
        if (enableReconnect && !isUnmounted) {
          reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
        }
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [
    code,
    enableReconnect,
    onClose,
    onError,
    onMessage,
    onOpen,
    reconnectDelayMs,
  ]);
}
