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
    // Проверяем актуальное состояние аутентификации
    if (!isAuthenticatedRef.current || !tokenRef.current) {
      console.warn('SocketIO: Not authenticated');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('SocketIO: Already connected');
      return;
    }

    if (isConnecting) {
      console.log('SocketIO: Connection in progress');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
      
      socketRef.current = io(`${wsUrl}${namespace}`, {
        auth: {
          token: tokenRef.current
        },
        query: {
          token: tokenRef.current  // Дублируем токен в query для совместимости
        },
        extraHeaders: {
          Authorization: `Bearer ${tokenRef.current}`  // Добавляем в заголовки
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        forceNew: false,
        timeout: 20000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      socketRef.current.on('connect', () => {
        console.log('SocketIO connected to', namespace);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onConnect?.();
      });


      socketRef.current.on('connect_error', (error) => {
        console.error('SocketIO connection error:', error);
        const errorMessage = error.message || 'Connection failed';
        
        // Проверяем код ошибки для детализации
        if (error.message?.includes('403') || error.code === 403) {
          setError('Unauthorized - please check your authentication');
        } else if (error.message?.includes('timeout')) {
          setError('Connection timeout - server may be unavailable');
        } else {
          setError(errorMessage);
        }
        
        setIsConnecting(false);
        onError?.(error);
      });

      socketRef.current.on('error', (error) => {
        console.error('SocketIO error:', error);
        setError(error.message || 'Socket error');
        onError?.(error);
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log('SocketIO disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Автоматическое переподключение только при неожиданном разрыве
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Сервер принудительно отключил или клиент отключился - не переподключаемся
          console.log('Disconnected by server or client - not reconnecting');
        }
        
        onDisconnect?.();
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
  }, [namespace, onMessage, onConnect, onDisconnect, onError]); // Убрали token и isAuthenticated

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.offAny();
      socketRef.current.disconnect();
      socketRef.current = null;
      
      // Обновляем состояние только если сокет действительно был подключен
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
    }
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

  // Исправленный useEffect без циклических зависимостей
  const isAuthenticatedRef = useRef(isAuthenticated);
  const tokenRef = useRef(token);
  
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    tokenRef.current = token;
  }, [isAuthenticated, token]);
  
  useEffect(() => {
    if (autoConnect && isAuthenticatedRef.current && tokenRef.current) {
      connect();
    } else if (!isAuthenticatedRef.current) {
      disconnect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.offAny();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect]); // Убрали connect и disconnect из зависимостей
  
  // Отдельный useEffect для отслеживания аутентификации
  useEffect(() => {
    if (autoConnect && isAuthenticated && token && !socketRef.current?.connected) {
      connect();
    } else if (!isAuthenticated && socketRef.current) {
      disconnect();
    }
  }, [isAuthenticated, token]);

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