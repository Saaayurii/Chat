import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocketConnection } from './useSocketConnection';
import { useSocketEventHandler } from './useSocketEventHandler';
import { useSocketAuth } from './useSocketAuth';

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
  sessionId?: string;
  isAnonymous?: boolean;
}

export var useSocketIO = (namespace: string, options: UseSocketIOOptions = {}) => {
  var {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true,
    sessionId,
    isAnonymous = false
  } = options;

  var { token, isAuthenticated, initializeAuth } = useAuthStore();
  var [isConnected, setIsConnected] = useState(false);
  
  var authState = { token, isAuthenticated, sessionId, isAnonymous };
  var { shouldConnect, getConnectionConfig } = useSocketAuth(authState, {
    initializeAuth,
    onAuthChange: (newAuthState) => {
      newAuthState.isAuthenticated && newAuthState.token ? 
        connectionManager.serverDisconnectedRef.current = false : null;
    }
  });

  var connectionManager = useSocketConnection({
    namespace,
    token: token || undefined,
    sessionId,
    isAnonymous,
    isAuthenticated,
    onConnect: () => {
      setIsConnected(true);
      onConnect?.();
    },
    onDisconnect: () => {
      setIsConnected(false);
      onDisconnect?.();
    },
    onError
  });

  var eventHandler = useSocketEventHandler({ onMessage });

  var connect = () => {
    shouldConnect().then(canConnect => {
      canConnect ? (() => {
        getConnectionConfig().then(config => {
          connectionManager.createConnection().then(socket => {
            socket ? eventHandler.setupEventHandlers(socket) : null;
          });
        });
      })() : connectionManager.disconnect();
    });
  };

  var emit = (event: string, data?: any) => 
    eventHandler.emit(connectionManager.socket, event, data);

  var on = (event: string, callback: (...args: any[]) => void) => 
    eventHandler.on(connectionManager.socket, event, callback);

  var off = (event: string, callback?: (...args: any[]) => void) => 
    eventHandler.off(connectionManager.socket, event, callback);

  useEffect(() => {
    var timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO useEffect triggered for ${namespace}`);
    console.log(`[${timestamp}] SocketIO: autoConnect: ${autoConnect}, authenticated: ${isAuthenticated}, token: ${!!token}`);
    
    autoConnect ? shouldConnect().then(canConnect => {
      canConnect && !connectionManager.socket?.connected && !connectionManager.isConnecting && !connectionManager.serverDisconnectedRef.current ? (() => {
        var timeout = setTimeout(() => {
          console.log(`[${timestamp}] SocketIO: Timeout fired, calling connect`);
          connect();
        }, 100);
        
        return () => clearTimeout(timeout);
      })() : !canConnect && connectionManager.socket ? connectionManager.disconnect() : null;
    }) : null;

    return () => {
      console.log(`[${timestamp}] SocketIO: Cleanup for ${namespace}`);
      connectionManager.socket ? (() => {
        eventHandler.cleanupEventHandlers(connectionManager.socket);
        connectionManager.disconnect();
      })() : null;
    };
  }, [isAuthenticated, token, autoConnect, connectionManager.isConnecting]);

  return {
    isConnected,
    isConnecting: connectionManager.isConnecting,
    error: connectionManager.error,
    emit,
    on,
    off,
    reconnect: connectionManager.reconnect,
    disconnect: connectionManager.disconnect
  };
};