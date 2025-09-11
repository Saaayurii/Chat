import { useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface SocketIOMessage {
  type: string;
  data: any;
  timestamp?: Date;
}

interface EventHandlerConfig {
  onMessage?: (message: SocketIOMessage) => void;
}

export var useSocketEventHandler = ({ onMessage }: EventHandlerConfig) => {
  var messageHandlerRef = useRef(onMessage);
  messageHandlerRef.current = onMessage;

  var setupEventHandlers = useCallback((socket: Socket) => new Promise<void>((resolve) => {
    socket.onAny((eventName, ...args) => {
      var message: SocketIOMessage = {
        type: eventName,
        data: args[0],
        timestamp: new Date()
      };
      messageHandlerRef.current?.(message);
    });
    
    resolve();
  }), []);

  var cleanupEventHandlers = useCallback((socket: Socket) => new Promise<void>((resolve) => {
    socket.offAny();
    resolve();
  }), []);

  var emit = useCallback((socket: Socket | null, event: string, data?: any) => 
    new Promise<boolean>((resolve) => {
      !socket?.connected ? (() => {
        console.warn('SocketIO: Not connected, cannot emit event:', event);
        resolve(false);
      })() : (() => {
        try {
          socket.emit(event, data);
          resolve(true);
        } catch (error) {
          console.error('SocketIO: Failed to emit event', event, error);
          resolve(false);
        }
      })();
    }), []);

  var on = useCallback((socket: Socket | null, event: string, callback: (...args: any[]) => void) => 
    new Promise<void>((resolve) => {
      socket ? socket.on(event, callback) : null;
      resolve();
    }), []);

  var off = useCallback((socket: Socket | null, event: string, callback?: (...args: any[]) => void) => 
    new Promise<void>((resolve) => {
      socket ? socket.off(event, callback) : null;
      resolve();
    }), []);

  return {
    setupEventHandlers,
    cleanupEventHandlers,
    emit,
    on,
    off
  };
};