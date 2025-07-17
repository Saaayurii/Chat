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

  const { token, isAuthenticated, initializeAuth } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const tokenRef = useRef(token);
  const serverDisconnectedRef = useRef(false); // Флаг для отслеживания принудительного отключения сервером
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Инициализируем auth при первом запуске
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] SocketIO: Initializing auth for ${namespace}`);
    initializeAuth();
  }, [namespace, initializeAuth]);

  // Update refs when auth state changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO: Auth state changed for ${namespace} - authenticated: ${isAuthenticated}, token: ${!!token}`);
    
    isAuthenticatedRef.current = isAuthenticated;
    tokenRef.current = token;
    
    // Если сервер ранее отключил, а теперь у нас есть новые данные авторизации, сбрасываем флаг
    if (isAuthenticated && token && serverDisconnectedRef.current) {
      console.log(`[${timestamp}] SocketIO: Resetting serverDisconnected flag due to new auth`);
      serverDisconnectedRef.current = false;
    }
  }, [isAuthenticated, token, namespace]);

  const connect = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO: connect() called for ${namespace}`);
    console.log(`[${timestamp}] SocketIO: Auth state - authenticated: ${isAuthenticatedRef.current}, token: ${!!tokenRef.current}`);
    console.log(`[${timestamp}] SocketIO: Current state - isConnecting: ${isConnecting}, socketConnected: ${socketRef.current?.connected}, serverDisconnected: ${serverDisconnectedRef.current}`);
    
    // Проверяем актуальное состояние аутентификации
    if (!isAuthenticatedRef.current || !tokenRef.current) {
      console.warn(`[${timestamp}] SocketIO: Not authenticated - skipping connection`);
      return;
    }

    if (socketRef.current?.connected) {
      console.log(`[${timestamp}] SocketIO: Already connected`);
      return;
    }

    if (isConnecting) {
      console.log(`[${timestamp}] SocketIO: Connection in progress`);
      return;
    }

    if (serverDisconnectedRef.current) {
      console.log(`[${timestamp}] SocketIO: Server disconnected flag set - not connecting`);
      return;
    }

    console.log(`[${timestamp}] SocketIO: Starting connection process`);
    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
      console.log(`[${timestamp}] SocketIO: Connecting to ${wsUrl}${namespace}`);
      
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
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000
      });

      socketRef.current.on('connect', () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] SocketIO connected to ${namespace}`);
        console.log(`[${timestamp}] SocketIO: Connection ID: ${socketRef.current?.id}`);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onConnect?.();
      });


      socketRef.current.on('connect_error', (error) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] SocketIO connection error to ${namespace}:`, error);
        console.error(`[${timestamp}] SocketIO: Error type: ${error.type}, message: ${error.message}`);
        console.error(`[${timestamp}] SocketIO: Error context:`, error.context);
        console.error(`[${timestamp}] SocketIO: Error data:`, error.data);
        console.error(`[${timestamp}] SocketIO: Error stack:`, error.stack);
        const errorMessage = error.message || 'Connection failed';
        
        // Проверяем код ошибки для детализации
        if (error.message?.includes('403') || (error as any).code === 403) {
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
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] SocketIO error on ${namespace}:`, error);
        setError(error.message || 'Socket error');
        onError?.(error);
      });
      
      socketRef.current.on('disconnect', (reason) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] SocketIO disconnected from ${namespace}: ${reason}`);
        console.log(`[${timestamp}] SocketIO: Connection was active for: ${socketRef.current?.connected ? 'still connected' : 'disconnected'}`);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Автоматическое переподключение только при неожиданном разрыве
        if (reason === 'io server disconnect') {
          // Сервер принудительно отключил - помечаем флаг и не переподключаемся
          console.log(`[${timestamp}] SocketIO: Disconnected by server - marking as server disconnect`);
          serverDisconnectedRef.current = true;
        } else if (reason === 'io client disconnect') {
          // Клиент отключился - не переподключаемся
          console.log(`[${timestamp}] SocketIO: Disconnected by client - not reconnecting`);
        } else if (reason === 'transport close' || reason === 'transport error') {
          // При проблемах с транспортом - переподключаемся
          console.log(`[${timestamp}] SocketIO: Transport issue - will reconnect`);
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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO: Disconnect called for ${namespace}`);
    
    if (socketRef.current) {
      console.log(`[${timestamp}] SocketIO: Disconnecting active connection ID: ${socketRef.current.id}`);
      socketRef.current.offAny();
      socketRef.current.disconnect();
      socketRef.current = null;
      
      // Обновляем состояние только если сокет действительно был подключен
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
    } else {
      console.log(`[${timestamp}] SocketIO: No active connection to disconnect`);
    }
  }, [namespace]);

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
    console.log(`[${new Date().toISOString()}] SocketIO: Manual reconnect requested for ${namespace}`);
    serverDisconnectedRef.current = false; // Сбрасываем флаг при ручном переподключении
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect, namespace]);

  // Duplicate ref definitions removed - already defined above
  
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO useEffect #1 triggered for ${namespace}`);
    console.log(`[${timestamp}] SocketIO: autoConnect: ${autoConnect}, authenticated: ${isAuthenticatedRef.current}, token: ${!!tokenRef.current}`);
    
    if (autoConnect && isAuthenticatedRef.current && tokenRef.current) {
      console.log(`[${timestamp}] SocketIO: Calling connect from useEffect #1`);
      connect();
    } else if (!isAuthenticatedRef.current) {
      console.log(`[${timestamp}] SocketIO: Calling disconnect from useEffect #1`);
      disconnect();
    } else {
      console.log(`[${timestamp}] SocketIO: Not connecting - autoConnect: ${autoConnect}, authenticated: ${isAuthenticatedRef.current}, token: ${!!tokenRef.current}`);
    }

    return () => {
      console.log(`[${timestamp}] SocketIO: Cleanup useEffect #1 for ${namespace}`);
      if (socketRef.current) {
        socketRef.current.offAny();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect]); // Убрали connect и disconnect из зависимостей
  
  // Отдельный useEffect для отслеживания аутентификации
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO useEffect #2 triggered for ${namespace}`);
    console.log(`[${timestamp}] SocketIO: autoConnect: ${autoConnect}, authenticated: ${isAuthenticated}, token: ${!!token}, connected: ${!!socketRef.current?.connected}, connecting: ${isConnecting}, serverDisconnected: ${serverDisconnectedRef.current}`);
    
    if (autoConnect && isAuthenticated && token && !socketRef.current?.connected && !isConnecting && !serverDisconnectedRef.current) {
      console.log(`[${timestamp}] SocketIO: Setting timeout to connect from useEffect #2`);
      // Уменьшаем задержку для быстрого подключения
      const timeout = setTimeout(() => {
        console.log(`[${timestamp}] SocketIO: Timeout fired, calling connect`);
        connect();
      }, 100); // Уменьшаем задержку до 100ms
      
      return () => {
        console.log(`[${timestamp}] SocketIO: Clearing timeout in useEffect #2`);
        clearTimeout(timeout);
      };
    } else if (!isAuthenticated && socketRef.current) {
      console.log(`[${timestamp}] SocketIO: Calling disconnect from useEffect #2`);
      disconnect();
    } else if (serverDisconnectedRef.current) {
      console.log(`[${timestamp}] SocketIO: Server disconnected - not attempting reconnect`);
    } else {
      console.log(`[${timestamp}] SocketIO: Not connecting - conditions not met`);
    }
  }, [isAuthenticated, token, autoConnect, isConnecting]); // Добавляем isConnecting обратно

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