import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const { token, isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    !isAuthenticated || !token ? (() => {
      console.warn('WebSocket: Not authenticated');
      return;
    })() : null;

    wsRef.current?.readyState === WebSocket.CONNECTING ? (() => {
      return;
    })() : null;

    wsRef.current?.readyState === WebSocket.OPEN ? (() => {
      return;
    })() : null;

    setIsConnecting(true);
    setError(null);

    try {
      // Добавляем токен в URL для аутентификации
      const wsUrl = `${url}?token=${encodeURIComponent(token || '')}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          message.timestamp = new Date();
          onMessage?.(message);
        } catch (error) {
          console.error('WebSocket: Failed to parse message', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        onDisconnect?.();

          // Автоматическое переподключение
        if (event.code !== 1000 && // Не переподключаемся при нормальном закрытии
            reconnectAttemptsRef.current < maxReconnectAttempts &&
            isAuthenticated) {
          reconnectAttemptsRef.current++;
          console.log(
            `WebSocket: Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Не удалось подключиться к серверу. Проверьте соединение.');
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Ошибка подключения к серверу');
        setIsConnecting(false);
        onError?.(event);
      };

    } catch (error) {
      console.error('WebSocket: Failed to create connection', error);
      setError('Не удалось создать подключение');
      setIsConnecting(false);
    }
  }, [url, token, isAuthenticated, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    reconnectTimeoutRef.current ? clearTimeout(reconnectTimeoutRef.current) : null;

    wsRef.current ? (() => {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    })() : null;

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN ? (() => {
      console.warn('WebSocket: Connection not ready');
      return false;
    })() : null;

    try {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      wsRef.current?.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('WebSocket: Failed to send message', error);
      return false;
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    isAuthenticated && token ? connect() : disconnect();

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      reconnectTimeoutRef.current ? clearTimeout(reconnectTimeoutRef.current) : null;
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    reconnect,
    disconnect
  };
};