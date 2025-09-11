import { useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ConnectionConfig {
  namespace: string;
  token?: string;
  sessionId?: string;
  isAnonymous?: boolean;
  isAuthenticated?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export var useSocketConnection = (config: ConnectionConfig) => {
  var {
    namespace,
    token,
    sessionId,
    isAnonymous = false,
    isAuthenticated = false,
    onConnect,
    onDisconnect,
    onError
  } = config;

  var socketRef = useRef<Socket | null>(null);
  var serverDisconnectedRef = useRef(false);
  var [isConnecting, setIsConnecting] = useState(false);
  var [error, setError] = useState<string | null>(null);

  var createConnection = () => new Promise<Socket | null>((resolve) => {
    var timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO: Starting connection process for ${namespace}`);
    
    !isAnonymous && (!isAuthenticated || !token) ? (() => {
      console.warn(`[${timestamp}] SocketIO: Not authenticated and not anonymous - skipping connection`);
      resolve(null);
    })() : isAnonymous && !sessionId ? (() => {
      console.warn(`[${timestamp}] SocketIO: Anonymous connection requires sessionId`);
      resolve(null);
    })() : socketRef.current?.connected ? (() => {
      console.log(`[${timestamp}] SocketIO: Already connected`);
      resolve(socketRef.current);
    })() : isConnecting ? (() => {
      console.log(`[${timestamp}] SocketIO: Connection in progress`);
      resolve(null);
    })() : serverDisconnectedRef.current ? (() => {
      console.log(`[${timestamp}] SocketIO: Server disconnected flag set - not connecting`);
      resolve(null);
    })() : (() => {
      setIsConnecting(true);
      setError(null);

      try {
        var wsUrl = 'https://chat-backend-13tr.onrender.com';
        
        console.log(`[${timestamp}] SocketIO: Connecting to ${wsUrl}${namespace}`);
        
        var connectionOptions: any = {
          auth: isAnonymous ? { sessionId } : { token },
          query: isAnonymous ? { sessionId } : { token },
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          forceNew: true,
          timeout: 20000,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        };
        
        !isAnonymous ? connectionOptions.extraHeaders = { Authorization: `Bearer ${token}` } : null;
        
        var socket = io(`${wsUrl}${namespace}`, connectionOptions);
        socketRef.current = socket;
        
        socket.on('connect', () => {
          var connectTimestamp = new Date().toISOString();
          console.log(`[${connectTimestamp}] SocketIO connected to ${namespace}`);
          console.log(`[${connectTimestamp}] SocketIO: Connection ID: ${socket.id}`);
          setIsConnecting(false);
          setError(null);
          onConnect?.();
          resolve(socket);
        });

        socket.on('connect_error', (socketError) => {
          var errorTimestamp = new Date().toISOString();
          console.error(`[${errorTimestamp}] SocketIO connection error to ${namespace}:`, socketError);
          
          var errorMessage = socketError.message || 'Connection failed';
          
          socketError.message?.includes('403') || (socketError as any).code === 403 ? (() => {
            console.error(`[${errorTimestamp}] SocketIO: Authentication failed - token might be invalid`);
            setError('Unauthorized - please check your authentication');
            serverDisconnectedRef.current = true;
          })() : socketError.message?.includes('timeout') ? 
            setError('Connection timeout - server may be unavailable') :
            setError(errorMessage);
          
          setIsConnecting(false);
          onError?.(socketError);
          resolve(null);
        });

        socket.on('error', (socketError) => {
          var errorTimestamp = new Date().toISOString();
          console.error(`[${errorTimestamp}] SocketIO error on ${namespace}:`, socketError);
          setError(socketError.message || 'Socket error');
          onError?.(socketError);
        });
        
        socket.on('disconnect', (reason) => {
          var disconnectTimestamp = new Date().toISOString();
          console.log(`[${disconnectTimestamp}] SocketIO disconnected from ${namespace}: ${reason}`);
          setIsConnecting(false);
          
          reason === 'io server disconnect' ? (() => {
            console.log(`[${disconnectTimestamp}] SocketIO: Disconnected by server - marking as server disconnect`);
            serverDisconnectedRef.current = true;
          })() : reason === 'io client disconnect' ? 
            console.log(`[${disconnectTimestamp}] SocketIO: Disconnected by client - not reconnecting`) :
            (reason === 'transport close' || reason === 'transport error') ?
              console.log(`[${disconnectTimestamp}] SocketIO: Transport issue - will reconnect`) : null;
          
          onDisconnect?.();
        });

      } catch (connectionError) {
        console.error('SocketIO: Failed to create connection', connectionError);
        setError('Failed to create connection');
        setIsConnecting(false);
        resolve(null);
      }
    })();
  });

  var disconnect = () => new Promise<void>((resolve) => {
    var timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketIO: Disconnect called for ${namespace}`);
    
    socketRef.current ? (() => {
      console.log(`[${timestamp}] SocketIO: Disconnecting active connection ID: ${socketRef.current?.id}`);
      socketRef.current.offAny();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnecting(false);
      setError(null);
    })() : console.log(`[${timestamp}] SocketIO: No active connection to disconnect`);
    
    resolve();
  });

  var reconnect = () => new Promise<void>((resolve) => {
    console.log(`[${new Date().toISOString()}] SocketIO: Manual reconnect requested for ${namespace}`);
    serverDisconnectedRef.current = false;
    
    disconnect().then(() => {
      setTimeout(() => {
        console.log(`[${new Date().toISOString()}] SocketIO: Attempting reconnect for ${namespace}`);
        createConnection().then(() => resolve());
      }, 100);
    });
  });

  return {
    socket: socketRef.current,
    isConnecting,
    error,
    serverDisconnectedRef,
    createConnection,
    disconnect,
    reconnect
  };
};