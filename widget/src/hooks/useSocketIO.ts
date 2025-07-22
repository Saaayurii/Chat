import { useEffect, useCallback, useState } from 'react';
import { chatCore } from '../core';
import type { SocketIOMessage } from '../types';

interface UseSocketIOOptions {
  onMessage?: (message: SocketIOMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export const useSocketIO = (namespace: string = '/chat', options: UseSocketIOOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    console.log(`useSocketIO: Connecting to ${namespace}`);
    
    chatCore.connectWebSocket(namespace, {
      onMessage,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
        onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        onDisconnect?.();
      },
      onError: (err) => {
        setError(err.message);
        onError?.(err);
      }
    });
  }, [namespace, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    console.log('useSocketIO: Disconnecting');
    chatCore.disconnectWebSocket();
    setIsConnected(false);
    setError(null);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    return chatCore.emitWebSocket(event, data);
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Check connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = chatCore.isWebSocketConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isConnected,
    error,
    emit,
    connect,
    disconnect
  };
};