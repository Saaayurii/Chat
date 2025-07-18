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
  
  // Логирование для отслеживания перерендеров
  console.log(`[${new Date().toISOString()}] useChat: Hook called, user: ${user?.id || 'none'}`);
  
  // Проверяем состояние аутентификации для отладки
  const { isAuthenticated, token } = useAuthStore();
  console.log(`[${new Date().toISOString()}] useChat: Auth state - authenticated: ${isAuthenticated}, token: ${!!token}`);

  const handlersRef = useRef({
    handleNewMessage: null as any,
    handleMessageRead: null as any,
    handleUserTyping: null as any,
    handleConversationUpdated: null as any,
    handleUserOnline: null as any
  });

  const handleSocketIOMessage = useCallback((message: any) => {
    console.log('useChat received SocketIO message:', message);
    
    const { type, data } = message;
    const handlers = handlersRef.current;

    // Обрабатываем оба формата сообщений - прямые и вложенные
    const messageData = message.data || message;
    const messageType = message.type || type;

    switch (messageType) {
      case 'new_message':
      case 'new-message':
        handlers.handleNewMessage?.(messageData);
        break;
      case 'message-read':
        handlers.handleMessageRead?.(messageData);
        break;
      case 'user-typing':
        handlers.handleUserTyping?.({...messageData, isTyping: true});
        break;
      case 'user-stopped-typing':
        handlers.handleUserTyping?.({...messageData, isTyping: false});
        break;
      case 'conversation-updated':
        handlers.handleConversationUpdated?.(messageData);
        break;
      case 'user-online':
        handlers.handleUserOnline?.(messageData);
        break;
      case 'connected':
        console.log('Connected to chat:', messageData);
        break;
      case 'room-joined':
        console.log('Joined room:', messageData);
        break;
      case 'message-sent':
        console.log('Message sent confirmation:', messageData);
        break;
      case 'cached-messages':
        console.log('Received cached messages:', messageData);
        // Можно добавить обработку для предзагрузки сообщений
        break;
      case 'error':
        console.error('Chat error:', messageData);
        break;
      default:
        console.log('Unknown SocketIO event:', messageType, messageData);
    }
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
      console.log(`[${new Date().toISOString()}] Chat Socket.IO connected`);
    },
    onDisconnect: () => {
      console.log(`[${new Date().toISOString()}] Chat Socket.IO disconnected`);
    },
    autoConnect: true // Явно указываем autoConnect: true
  });
  
  // Логируем состояние socket соединения
  console.log(`[${new Date().toISOString()}] useChat: Socket state - connected: ${isConnected}, connecting: ${isConnecting}, error: ${wsError}`);

  const handleNewMessage = useCallback((messageData: any) => {
    console.log('handleNewMessage called with:', messageData);
    
    // Нормализуем данные сообщения для обработки разных форматов
    const message = {
      _id: messageData.id || messageData._id,
      id: messageData.id || messageData._id,
      text: messageData.text || messageData.content,
      content: messageData.text || messageData.content,
      senderId: messageData.senderId,
      conversationId: messageData.conversationId,
      createdAt: messageData.timestamp || messageData.createdAt,
      timestamp: messageData.timestamp || messageData.createdAt,
      type: messageData.type || 'text',
      status: messageData.status || 'sent',
      senderName: messageData.senderName,
      readBy: messageData.readBy || []
    };
    
    const conversationId = message.conversationId;
    
    if (!conversationId) {
      console.warn('No conversationId in message:', messageData);
      return;
    }
    
    // Обновляем кэш сообщений
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        if (!oldData) {
          return { data: [message], total: 1 };
        }
        const existingMessage = oldData.data.find((m: any) => 
          (m._id === message._id || m.id === message.id) && message._id
        );
        if (existingMessage) {
          console.log('Message already exists, skipping');
          return oldData;
        }
        console.log('Adding new message to cache');
        return {
          ...oldData,
          data: [...oldData.data, message]
        };
      }
    );

    // Обновляем список бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((conv: any) => 
          conv._id === conversationId || conv.id === conversationId ? {
            ...conv,
            lastMessage: {
              text: message.text,
              senderId: message.senderId,
              timestamp: message.createdAt,
              messageId: message._id
            },
            unreadMessagesCount: message.senderId !== user?.id ? 
              (conv.unreadMessagesCount || 0) + 1 : 
              (conv.unreadMessagesCount || 0)
          } : conv
        );
      }
    );
    
    // Инвалидируем запросы для обновления
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
    if (!isConnected) {
      console.warn('Cannot send message - socket not connected');
      return false;
    }
    return emit('send-message', {
      conversationId,
      text,
      type
    });
  }, [emit, isConnected]);

  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    if (!isConnected) {
      console.warn('Cannot mark as read - socket not connected');
      return false;
    }
    return emit('mark-as-read', {
      conversationId,
      messageId
    });
  }, [emit, isConnected]);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!isConnected) {
      console.warn('Cannot set typing status - socket not connected');
      return false;
    }
    return emit(isTyping ? 'typing-start' : 'typing-stop', {
      conversationId
    });
  }, [emit, isConnected]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!isConnected) {
      console.warn('Cannot join conversation - socket not connected, will retry when connected');
      return false;
    }
    return emit('join-room', {
      conversationId
    });
  }, [emit, isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!isConnected) {
      console.warn('Cannot leave conversation - socket not connected');
      return false;
    }
    return emit('leave-room', {
      conversationId
    });
  }, [emit, isConnected]);

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