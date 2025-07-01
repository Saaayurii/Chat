import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '@/store/authStore';
import { Message, Conversation } from '@/types';

interface ChatWebSocketData {
  // Типы сообщений WebSocket
  NEW_MESSAGE: {
    message: Message;
    conversationId: string;
  };
  MESSAGE_READ: {
    messageId: string;
    conversationId: string;
    userId: string;
  };
  USER_TYPING: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  };
  CONVERSATION_UPDATED: {
    conversation: Conversation;
  };
  USER_ONLINE: {
    userId: string;
    isOnline: boolean;
  };
}

interface TypingUsers {
  [conversationId: string]: string[]; // userId[]
}

export const useChat = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {0: typingUsers, 1: setTypingUsers} = useState<TypingUsers>({});
  const {0: onlineUsers, 1: setOnlineUsers} = useState<Set<string>>(new Set());

  const handleWebSocketMessage = useCallback((message: any) => {
    const { type, data } = message;

    type === 'NEW_MESSAGE' ? handleNewMessage(data as ChatWebSocketData['NEW_MESSAGE']) :
    type === 'MESSAGE_READ' ? handleMessageRead(data as ChatWebSocketData['MESSAGE_READ']) :
    type === 'USER_TYPING' ? handleUserTyping(data as ChatWebSocketData['USER_TYPING']) :
    type === 'CONVERSATION_UPDATED' ? handleConversationUpdated(data as ChatWebSocketData['CONVERSATION_UPDATED']) :
    type === 'USER_ONLINE' ? handleUserOnline(data as ChatWebSocketData['USER_ONLINE']) :
    console.log('Unknown WebSocket message type:', type);
  }, []);

  const {
    isConnected,
    isConnecting,
    error: wsError,
    sendMessage,
    reconnect
  } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/chat`,
    {
      onMessage: handleWebSocketMessage,
      onConnect: () => {
        console.log('Chat WebSocket connected');
        // Присоединяемся к комнатам пользователя
        user?.id ? sendMessage('JOIN_USER_ROOMS', { userId: user.id }) : null;
      },
      onDisconnect: () => {
        console.log('Chat WebSocket disconnected');
      }
    }
  );

  const handleNewMessage = useCallback((data: ChatWebSocketData['NEW_MESSAGE']) => {
    const { message, conversationId } = data;
    
    // Обновляем кэш сообщений
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        !oldData ? { data: [message], total: 1 } : (() => {
          const existingMessage = oldData.data.find((m: Message) => m._id === message._id);
          return existingMessage ? oldData : {
            ...oldData,
            data: [...oldData.data, message]
          };
        })();
      }
    );

    // Обновляем список бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: Conversation[]) => {
        !oldData ? oldData : oldData.map(conv => 
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

  const handleMessageRead = useCallback((data: ChatWebSocketData['MESSAGE_READ']) => {
    const { messageId, conversationId, userId } = data;
    
    // Обновляем статус прочтения сообщения
    queryClient.setQueryData(
      ['messages', conversationId],
      (oldData: any) => {
        !oldData ? oldData : {
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

  const handleUserTyping = useCallback((data: ChatWebSocketData['USER_TYPING']) => {
    const { conversationId, userId, isTyping } = data;
    
    // Не показываем что текущий пользователь печатает
    userId === user?.id ? (() => { return; })() : null;
    
    setTypingUsers(prev => {
      const currentTyping = prev[conversationId] || [];
      
      return isTyping ? !currentTyping.includes(userId) ? {
        ...prev,
        [conversationId]: [...currentTyping, userId]
      } : prev : {
        ...prev,
        [conversationId]: currentTyping.filter(id => id !== userId)
      };
    });
  }, [user?.id]);

  const handleConversationUpdated = useCallback((data: ChatWebSocketData['CONVERSATION_UPDATED']) => {
    const { conversation } = data;
    
    // Обновляем список бесед
    queryClient.setQueryData(
      ['conversations'],
      (oldData: Conversation[]) => {
        !oldData ? oldData : (() => {
          const index = oldData.findIndex(conv => conv._id === conversation._id);
          return index !== -1 ? (() => {
            const newData = [...oldData];
            newData[index] = conversation;
            return newData;
          })() : [conversation, ...oldData];
        })();
      }
    );
  }, [queryClient]);

  const handleUserOnline = useCallback((data: ChatWebSocketData['USER_ONLINE']) => {
    const { userId, isOnline } = data;
    
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      isOnline ? newSet.add(userId) : newSet.delete(userId);
      return newSet;
    });
  }, []);

  // Функции для отправки WebSocket сообщений
  const sendChatMessage = useCallback((conversationId: string, text: string, type = 'text') => {
    return sendMessage('SEND_MESSAGE', {
      conversationId,
      text,
      type
    });
  }, [sendMessage]);

  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    return sendMessage('MARK_AS_READ', {
      conversationId,
      messageId
    });
  }, [sendMessage]);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    return sendMessage('SET_TYPING', {
      conversationId,
      isTyping
    });
  }, [sendMessage]);

  const joinConversation = useCallback((conversationId: string) => {
    return sendMessage('JOIN_CONVERSATION', {
      conversationId
    });
  }, [sendMessage]);

  const leaveConversation = useCallback((conversationId: string) => {
    return sendMessage('LEAVE_CONVERSATION', {
      conversationId
    });
  }, [sendMessage]);

  // Очистка таймеров набора текста
  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};
    
    Object.entries(typingUsers).forEach(([conversationId, users]) => {
      users.forEach(userId => {
        const key = `${conversationId}-${userId}`;
        if (timers[key]) {
          clearTimeout(timers[key]);
        }
        
        // Автоматически убираем статус "печатает" через 3 секунды
        timers[key] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: prev[conversationId]?.filter(id => id !== userId) || []
          }));
        }, 3000);
      });
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [typingUsers]);

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