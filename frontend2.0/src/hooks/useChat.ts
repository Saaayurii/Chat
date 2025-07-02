import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketIO } from './useSocketIO';
import { useAuthStore } from '@/store/authStore';
import { Message, Conversation } from '@/types';

interface TypingUsers {
  [conversationId: string]: string[]; // userId[]
}

export const useChat = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUsers>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const handlersRef = useRef({
    handleNewMessage: null as any,
    handleMessageRead: null as any,
    handleUserTyping: null as any,
    handleConversationUpdated: null as any,
    handleUserOnline: null as any
  });

  const handleSocketIOMessage = useCallback((message: any) => {
    const { type, data } = message;
    const handlers = handlersRef.current;

    type === 'new-message' ? handlers.handleNewMessage?.(data) :
    type === 'message-read' ? handlers.handleMessageRead?.(data) :
    type === 'user-typing' ? handlers.handleUserTyping?.({...data, isTyping: true}) :
    type === 'user-stopped-typing' ? handlers.handleUserTyping?.({...data, isTyping: false}) :
    type === 'conversation-updated' ? handlers.handleConversationUpdated?.(data) :
    type === 'user-online' ? handlers.handleUserOnline?.(data) :
    type === 'connected' ? console.log('Connected to chat:', data) :
    type === 'room-joined' ? console.log('Joined room:', data) :
    type === 'error' ? console.error('Chat error:', data) :
    console.log('Unknown SocketIO event:', type, data);
  }, []);

  const {
    isConnected,
    isConnecting,
    error: wsError,
    emit,
    reconnect
  } = useSocketIO('/chat', {
    onMessage: handleSocketIOMessage,
    onConnect: () => {
      console.log('Chat Socket.IO connected');
    },
    onDisconnect: () => {
      console.log('Chat Socket.IO disconnected');
    }
  });

  const handleNewMessage = useCallback((message: Message) => {
    const conversationId = message.conversationId;
    
    // Обновляем кэш сообщений
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        if (!oldData) {
          return { data: [message], total: 1 };
        }
        const existingMessage = oldData.data.find((m: Message) => m._id === message._id);
        if (existingMessage) {
          return oldData;
        }
        return {
          ...oldData,
          data: [...oldData.data, message]
        };
      }
    );

    // Обновляем список бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: Conversation[]) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv._id === conversationId ? {
            ...conv,
            lastMessage: {
              text: message.text,
              senderId: message.senderId,
              timestamp: message.createdAt,
              messageId: message._id
            },
            unreadMessagesCount: message.senderId !== user?.id ? conv.unreadMessagesCount + 1 : conv.unreadMessagesCount
          } : conv
        );
      }
    );
  }, [queryClient, user?.id]);

  const handleMessageRead = useCallback((data: { messageId: string; conversationId: string; userId: string }) => {
    const { messageId, conversationId, userId } = data;
    
    // Обновляем статус прочтения сообщения
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((message: Message) => 
            message._id === messageId ? {
              ...message,
              readBy: [...new Set([...message.readBy, userId])],
              readTimestamps: {
                ...message.readTimestamps,
                [userId]: new Date()
              }
            } : message
          )
        };
      }
    );
  }, [queryClient]);

  const handleUserTyping = useCallback((data: { conversationId: string; userId: string; username?: string; isTyping: boolean }) => {
    const { conversationId, userId, isTyping } = data;
    
    // Не показываем что текущий пользователь печатает
    if (userId === user?.id) {
      return;
    }
    
    setTypingUsers(prev => {
      const currentTyping = prev[conversationId] || [];
      
      if (isTyping) {
        if (!currentTyping.includes(userId)) {
          return {
            ...prev,
            [conversationId]: [...currentTyping, userId]
          };
        }
        return prev;
      } else {
        return {
          ...prev,
          [conversationId]: currentTyping.filter(id => id !== userId)
        };
      }
    });
  }, [user?.id]);

  const handleConversationUpdated = useCallback((conversation: Conversation) => {
    // Обновляем список бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: Conversation[]) => {
        if (!oldData) return oldData;
        const index = oldData.findIndex(conv => conv._id === conversation._id);
        if (index !== -1) {
          const newData = [...oldData];
          newData[index] = conversation;
          return newData;
        }
        return [conversation, ...oldData];
      }
    );
  }, [queryClient]);

  const handleUserOnline = useCallback((data: { userId: string; isOnline: boolean }) => {
    const { userId, isOnline } = data;
    
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      isOnline ? newSet.add(userId) : newSet.delete(userId);
      return newSet;
    });
  }, []);

  // Функции для отправки Socket.IO сообщений
  const sendChatMessage = useCallback((conversationId: string, text: string, type = 'text') => {
    return emit('send-message', {
      conversationId,
      text,
      type
    });
  }, [emit]);

  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    return emit('mark-as-read', {
      conversationId,
      messageId
    });
  }, [emit]);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    return emit(isTyping ? 'typing-start' : 'typing-stop', {
      conversationId
    });
  }, [emit]);

  const joinConversation = useCallback((conversationId: string) => {
    return emit('join-room', {
      conversationId
    });
  }, [emit]);

  const leaveConversation = useCallback((conversationId: string) => {
    return emit('leave-room', {
      conversationId
    });
  }, [emit]);

  // Очистка таймеров набора текста - оптимизированная версия
  const typingTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  useEffect(() => {
    // Очищаем старые таймеры
    Object.values(typingTimersRef.current).forEach(timer => clearTimeout(timer));
    typingTimersRef.current = {};
    
    // Создаем новые таймеры только для активных пользователей
    Object.entries(typingUsers).forEach(([conversationId, users]) => {
      users.forEach(userId => {
        const key = `${conversationId}-${userId}`;
        typingTimersRef.current[key] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: prev[conversationId]?.filter(id => id !== userId) || []
          }));
        }, 3000);
      });
    });

    return () => {
      Object.values(typingTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [typingUsers]);

  // Обновляем ссылки на обработчики
  useEffect(() => {
    handlersRef.current.handleNewMessage = handleNewMessage;
    handlersRef.current.handleMessageRead = handleMessageRead;
    handlersRef.current.handleUserTyping = handleUserTyping;
    handlersRef.current.handleConversationUpdated = handleConversationUpdated;
    handlersRef.current.handleUserOnline = handleUserOnline;
  }, [handleNewMessage, handleMessageRead, handleUserTyping, handleConversationUpdated, handleUserOnline]);

  return {
    // WebSocket состояние
    isConnected,
    isConnecting,
    wsError,
    reconnect,
    
    // Chat состояние
    typingUsers,
    onlineUsers,
    
    // Chat функции
    sendChatMessage,
    markAsRead,
    setTyping,
    joinConversation,
    leaveConversation
  };
};