import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketIO } from './useSocketIO';
import { useAuthStore } from '@/store/authStore';
import { useChatHandlers } from './useChatHandlers';
import { useChatActions } from './useChatActions';
import { useChatState } from './useChatState';
import { useChatEventRouter } from './useChatEventRouter';

export var useChat = () => {
  var { user } = useAuthStore();
  var queryClient = useQueryClient();
  var { isAuthenticated, token } = useAuthStore();
  
  console.log(`[${new Date().toISOString()}] useChat: Hook called, user: ${user?.id || 'none'}`);
  console.log(`[${new Date().toISOString()}] useChat: Auth state - authenticated: ${isAuthenticated}, token: ${!!token}`);

  var chatHandlers = useChatHandlers({ queryClient, userId: user?.id });
  var chatState = useChatState(user?.id);
  var { handleSocketIOMessage, updateHandlers } = useChatEventRouter({
    ...chatHandlers,
    handleUserTyping: chatState.handleUserTyping,
    handleUserOnline: chatState.handleUserOnline
  });

  var {
    isConnected,
    isConnecting,
    error: wsError,
    emit,
    reconnect
  } = useSocketIO('/chat', {
    onMessage: handleSocketIOMessage,
    onConnect: () => console.log(`[${new Date().toISOString()}] Chat Socket.IO connected`),
    onDisconnect: () => console.log(`[${new Date().toISOString()}] Chat Socket.IO disconnected`),
    autoConnect: true
  });
  
  console.log(`[${new Date().toISOString()}] useChat: Socket state - connected: ${isConnected}, connecting: ${isConnecting}, error: ${wsError}`);
  
  var chatActions = useChatActions({ emit, isConnected });

  useEffect(() => {
    updateHandlers({
      ...chatHandlers,
      handleUserTyping: chatState.handleUserTyping,
      handleUserOnline: chatState.handleUserOnline
    });
  }, [chatHandlers, chatState, updateHandlers]);

  return {
    isConnected,
    isConnecting,
    wsError,
    reconnect,
    typingUsers: chatState.typingUsers,
    onlineUsers: chatState.onlineUsers,
    ...chatActions
  };
};