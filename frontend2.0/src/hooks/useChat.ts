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
    
    if (isTyping) {
      setTypingUsers(prev => {
        const currentTyping = prev[conversationId] || [];
        if (!currentTyping.includes(userId)) {
          // Устанавливаем таймер для автоматической очистки
          const key = `${conversationId}-${userId}`;
          if (typingTimersRef.current[key]) {
            clearTimeout(typingTimersRef.current[key]);
          }
          typingTimersRef.current[key] = setTimeout(() => {
            setTypingUsers(prevState => ({
              ...prevState,
              [conversationId]: prevState[conversationId]?.filter(id => id !== userId) || []
            }));
            delete typingTimersRef.current[key];
          }, 3000);
          
          return {
            ...prev,
            [conversationId]: [...currentTyping, userId]
          };
        }
        // Обновляем таймер если пользователь все еще печатает
        const key = `${conversationId}-${userId}`;
        if (typingTimersRef.current[key]) {
          clearTimeout(typingTimersRef.current[key]);
        }
        typingTimersRef.current[key] = setTimeout(() => {
          setTypingUsers(prevState => ({
            ...prevState,
            [conversationId]: prevState[conversationId]?.filter(id => id !== userId) || []
          }));
          delete typingTimersRef.current[key];
        }, 3000);
        return prev;
      });
    } else {
      // Очищаем таймер и убираем пользователя из списка печатающих
      const key = `${conversationId}-${userId}`;
      if (typingTimersRef.current[key]) {
        clearTimeout(typingTimersRef.current[key]);
        delete typingTimersRef.current[key];
      }
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
      }));
    }
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

  // Очистка таймеров набора текста - исправленная версия
  const typingTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Функция очистки таймера для конкретного пользователя
  const clearTypingTimer = useCallback((conversationId: string, userId: string) => {
    const key = `${conversationId}-${userId}`;
    if (typingTimersRef.current[key]) {
      clearTimeout(typingTimersRef.current[key]);
      delete typingTimersRef.current[key];
    }
  }, []);
  
  // Функция установки таймера для конкретного пользователя
  const setTypingTimer = useCallback((conversationId: string, userId: string) => {
    const key = `${conversationId}-${userId}`;
    
    // Очищаем существующий таймер если он есть
    if (typingTimersRef.current[key]) {
      clearTimeout(typingTimersRef.current[key]);
      delete typingTimersRef.current[key];
    }
    
    // Устанавливаем новый таймер
    typingTimersRef.current[key] = setTimeout(() => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.filter(id => id !== userId) || []
      }));
      delete typingTimersRef.current[key];
    }, 3000);
  }, []);
  
  // Очистка всех таймеров при размонтировании
  useEffect(() => {
    return () => {
      Object.values(typingTimersRef.current).forEach(timer => clearTimeout(timer));
      typingTimersRef.current = {};
    };
  }, []);

  // Обновляем ссылки на обработчики - стабилизированная версия
  useEffect(() => {
    handlersRef.current.handleNewMessage = handleNewMessage;
    handlersRef.current.handleMessageRead = handleMessageRead;
    handlersRef.current.handleUserTyping = handleUserTyping;
    handlersRef.current.handleConversationUpdated = handleConversationUpdated;
    handlersRef.current.handleUserOnline = handleUserOnline;
  }); // Убираем зависимости чтобы обновлять каждый рендер без циклов

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