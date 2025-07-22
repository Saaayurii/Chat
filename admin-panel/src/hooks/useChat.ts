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
    handleConversationRead: null as any,
    handleMarkAsReadSuccess: null as any,
    handleUserTyping: null as any,
    handleConversationUpdated: null as any,
    handleUserOnline: null as any,
    handleNewConversationAssigned: null as any,
    handleMessagesRead: null as any,
    handleSingleMessageRead: null as any
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
      case 'conversation-read':
        handlers.handleConversationRead?.(messageData);
        break;
      case 'mark-as-read-success':
        handlers.handleMarkAsReadSuccess?.(messageData);
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
      case 'new-conversation-assigned':
        handlers.handleNewConversationAssigned?.(messageData);
        break;
      case 'messages-read':
        handlers.handleMessagesRead?.(messageData);
        break;
      case 'message-read':
        handlers.handleSingleMessageRead?.(messageData);
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
        console.error('Full error details:', JSON.stringify(messageData, null, 2));
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
      senderRole: messageData.senderRole, // Добавляем роль отправителя
      readBy: messageData.readBy || [],
      isRead: messageData.isRead || false, // Добавляем статус прочтения
      readTimestamps: messageData.readTimestamps || {}
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
              isRead: true, // Отмечаем как прочитанное
              readTimestamps: {
                ...message.readTimestamps,
                [userId]: new Date()
              }
            } : message
          )
        };
      }
    );
    
    // Обновляем счетчик непрочитанных сообщений в списке бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((conv: any) => {
          if (conv._id === conversationId || conv.id === conversationId) {
            const newUnreadCount = Math.max(0, (conv.unreadMessagesCount || 0) - 1);
            return {
              ...conv,
              unreadMessagesCount: newUnreadCount
            };
          }
          return conv;
        });
      }
    );
    
    // Убираем инвалидацию - только локальное обновление кэша
    // чтобы избежать мерцания при загрузке данных с сервера
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

  const handleNewConversationAssigned = useCallback((data: any) => {
    console.log('Новая беседа назначена оператору:', data);
    
    const { conversation, assignedOperatorId, userName, userEmail, userType } = data;
    
    // Проверяем, что беседа назначена текущему оператору
    if (assignedOperatorId === user?.id) {
      // Добавляем новую беседу в список бесед
      queryClient.setQueryData(
        ['conversations'],
        (oldData: Conversation[]) => {
          if (!oldData) return [conversation];
          
          // Проверяем, что беседа еще не существует
          const exists = oldData.find(conv => 
            conv._id === conversation._id || conv.id === conversation.id
          );
          
          if (!exists) {
            console.log(`Добавлена новая беседа от ${userName} (${userType})`);
            return [conversation, ...oldData];
          }
          
          return oldData;
        }
      );
      
      // Можно добавить показ уведомления о новой беседе
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`Новая беседа от ${userName}`, {
            body: `Пользователь ${userName} ${userEmail ? `(${userEmail})` : ''} начал беседу`,
            icon: '/chat-icon.png',
            tag: `conversation-${conversation._id}`
          });
        }
      }
    }
  }, [queryClient, user?.id]);

  const handleMessagesRead = useCallback((data: { conversationId: string; readBy: string; readAt: string }) => {
    console.log('Все сообщения беседы прочитаны:', data);
    
    const { conversationId, readBy, readAt } = data;
    
    // Обновляем все сообщения в беседе как прочитанные
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        if (!oldData) return oldData;
        
        let messages = [];
        if (oldData.data && Array.isArray(oldData.data)) {
          messages = oldData.data;
        } else if (oldData.messages && Array.isArray(oldData.messages)) {
          messages = oldData.messages;
        } else if (Array.isArray(oldData)) {
          messages = oldData;
        } else {
          return oldData;
        }
        
        const updatedMessages = messages.map((message: any) => {
          // Только сообщения НЕ от пользователя, который прочитал
          if (message.senderId !== readBy) {
            return {
              ...message,
              readBy: [...new Set([...(message.readBy || []), readBy])],
              isRead: true,
              readTimestamps: {
                ...message.readTimestamps,
                [readBy]: readAt
              }
            };
          }
          return message;
        });
        
        if (oldData.data) {
          return { ...oldData, data: updatedMessages };
        } else if (oldData.messages) {
          return { ...oldData, messages: updatedMessages };
        }
        return updatedMessages;
      }
    );

    // Обновляем счетчик непрочитанных в списке бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((conv: any) => {
          if (conv._id === conversationId || conv.id === conversationId) {
            return {
              ...conv,
              unreadMessagesCount: readBy === user?.id ? 0 : conv.unreadMessagesCount
            };
          }
          return conv;
        });
      }
    );
  }, [queryClient, user?.id]);

  const handleSingleMessageRead = useCallback((data: { conversationId: string; messageId: string; readBy: string; readAt: string }) => {
    console.log('Сообщение прочитано:', data);
    
    const { conversationId, messageId, readBy, readAt } = data;
    
    // Обновляем конкретное сообщение как прочитанное
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        if (!oldData) return oldData;
        
        let messages = [];
        if (oldData.data && Array.isArray(oldData.data)) {
          messages = oldData.data;
        } else if (oldData.messages && Array.isArray(oldData.messages)) {
          messages = oldData.messages;
        } else if (Array.isArray(oldData)) {
          messages = oldData;
        } else {
          return oldData;
        }
        
        const updatedMessages = messages.map((message: any) => {
          if ((message._id === messageId || message.id === messageId) && message.senderId !== readBy) {
            return {
              ...message,
              readBy: [...new Set([...(message.readBy || []), readBy])],
              isRead: true,
              readTimestamps: {
                ...message.readTimestamps,
                [readBy]: readAt
              }
            };
          }
          return message;
        });
        
        if (oldData.data) {
          return { ...oldData, data: updatedMessages };
        } else if (oldData.messages) {
          return { ...oldData, messages: updatedMessages };
        }
        return updatedMessages;
      }
    );
  }, [queryClient, user?.id]);

  const handleConversationRead = useCallback((data: { conversationId: string; readBy: string; readAt: string }) => {
    const { conversationId, readBy } = data;
    
    // Обновляем все сообщения в беседе как прочитанные пользователем readBy
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        if (!oldData) return oldData;
        
        // Проверяем различные форматы данных
        let messages = [];
        if (oldData.data && Array.isArray(oldData.data)) {
          messages = oldData.data;
        } else if (oldData.messages && Array.isArray(oldData.messages)) {
          messages = oldData.messages;
        } else if (Array.isArray(oldData)) {
          messages = oldData;
        } else {
          console.warn('Unable to find messages array in data:', oldData);
          return oldData;
        }
        
        const updatedMessages = messages.map((message: any) => {
          // Только сообщения от других пользователей отмечаем как прочитанные
          if (message.senderId !== readBy) {
            return {
              ...message,
              readBy: [...new Set([...(message.readBy || []), readBy])],
              isRead: true,
              readTimestamps: {
                ...message.readTimestamps,
                [readBy]: data.readAt
              }
            };
          }
          return message;
        });
        
        // Возвращаем в том же формате
        if (oldData.data) {
          return { ...oldData, data: updatedMessages };
        } else if (oldData.messages) {
          return { ...oldData, messages: updatedMessages };
        } else {
          return updatedMessages;
        }
      }
    );
    
    // Обновляем счетчик непрочитанных сообщений в списке бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((conv: any) => {
          if (conv._id === conversationId || conv.id === conversationId) {
            return {
              ...conv,
              unreadMessagesCount: readBy === user?.id ? 0 : conv.unreadMessagesCount
            };
          }
          return conv;
        });
      }
    );
    
    // Убираем инвалидацию - только локальное обновление кэша
    // чтобы избежать мерцания при загрузке данных с сервера
  }, [queryClient, user?.id]);

  const handleMarkAsReadSuccess = useCallback((data: { conversationId: string; messageId?: string; readAt: string }) => {
    const { conversationId } = data;
    
    // Теперь обновляем кэш только после подтверждения сервера
    queryClient.setQueryData(
      ['conversations'],
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((conv: any) => {
          if (conv._id === conversationId || conv.id === conversationId) {
            return {
              ...conv,
              unreadMessagesCount: 0,
              [`unreadByParticipant.${user?.id}`]: 0
            };
          }
          return conv;
        });
      }
    );
  }, [queryClient, user?.id]);

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
    
    const messageData = {
      conversationId,
      text,
      type
    };
    
    console.log('Sending message via WebSocket:', messageData);
    return emit('send-message', messageData);
  }, [emit, isConnected]);

  const markAsRead = useCallback((conversationId: string, messageId?: string) => {
    if (!isConnected) {
      console.warn('Cannot mark as read - socket not connected');
      return false;
    }
    const payload: { conversationId: string; messageId?: string } = { conversationId };
    if (messageId) {
      payload.messageId = messageId;
    }
    return emit('mark-as-read', payload);
  }, [emit, isConnected]);

  const markConversationAsRead = useCallback((conversationId: string) => {
    if (!isConnected) {
      console.warn('Cannot mark conversation as read - socket not connected');
      return false;
    }
    return emit('mark-as-read', {
      conversationId
      // без messageId - отметка всей беседы
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
    handlersRef.current.handleConversationRead = handleConversationRead;
    handlersRef.current.handleMarkAsReadSuccess = handleMarkAsReadSuccess;
    handlersRef.current.handleUserTyping = handleUserTyping;
    handlersRef.current.handleConversationUpdated = handleConversationUpdated;
    handlersRef.current.handleUserOnline = handleUserOnline;
    handlersRef.current.handleNewConversationAssigned = handleNewConversationAssigned;
    handlersRef.current.handleMessagesRead = handleMessagesRead;
    handlersRef.current.handleSingleMessageRead = handleSingleMessageRead;
  }, [handleNewMessage, handleMessageRead, handleConversationRead, handleMarkAsReadSuccess, handleUserTyping, handleConversationUpdated, handleUserOnline, handleNewConversationAssigned, handleMessagesRead, handleSingleMessageRead]);

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
    markConversationAsRead,
    setTyping,
    joinConversation,
    leaveConversation
  };
};