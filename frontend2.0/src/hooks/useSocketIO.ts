import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface SocketIOMessage {
  type: string;
  data: any;
  timestamp?: Date;
}

interface UseSocketIOOptions {
  onMessage?: (message: SocketIOMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export const useSocketIO = (namespace: string, options: UseSocketIOOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true
  } = options;

  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.warn('SocketIO: Not authenticated');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    if (isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
      
      socketRef.current = io(`${wsUrl}${namespace}`, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        forceNew: false
      });

      socketRef.current.on('connect', () => {
        console.log('SocketIO connected to', namespace);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('SocketIO disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('SocketIO connection error:', error);
        setError(error.message || 'Connection failed');
        setIsConnecting(false);
        onError?.(error);
      });

      socketRef.current.on('error', (error) => {
        console.error('SocketIO error:', error);
        setError(error.message || 'Socket error');
        onError?.(error);
      });

      // Обработчик для всех входящих сообщений
      socketRef.current.onAny((eventName, ...args) => {
        const message: SocketIOMessage = {
          type: eventName,
          data: args[0],
          timestamp: new Date()
        };
        onMessage?.(message);
      });

    } catch (error) {
      console.error('SocketIO: Failed to create connection', error);
      setError('Failed to create connection');
      setIsConnecting(false);
    }
  }, [namespace, token, isAuthenticated, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.offAny();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('SocketIO: Not connected, cannot emit event:', event);
      return false;
    }

    try {
      socketRef.current.emit(event, data);
      return true;
    } catch (error) {
      console.error('SocketIO: Failed to emit event', event, error);
      return false;
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect();
    } else if (!isAuthenticated) {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, autoConnect, connect]);

  return {
    isConnected,
    isConnecting,
    error,
    emit,
    on,
    off,
    reconnect,
    disconnect
  };
};