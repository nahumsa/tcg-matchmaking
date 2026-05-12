import { useEffect, useRef } from 'react';
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
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onClose, onError, onMessage, onOpen]);

  useEffect(() => {
    if (!code) return undefined;

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isUnmounted = false;

    const connect = () => {
      ws = new WebSocket(`${config.wsUrl}/ws/${code}`);
      ws.onopen = () => onOpenRef.current?.();
      ws.onmessage = (event) => {
        try {
          onMessageRef.current(JSON.parse(event.data));
        } catch {
          onErrorRef.current?.();
        }
      };
      ws.onerror = () => onErrorRef.current?.();
      ws.onclose = () => {
        onCloseRef.current?.();
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
  }, [code, enableReconnect, reconnectDelayMs]);
}
