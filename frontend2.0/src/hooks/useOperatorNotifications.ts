import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

interface NotificationMessage {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'anonymous' | 'authorized';
  sessionId?: string;
}

export const useOperatorNotifications = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleNewMessageNotification = useCallback((data: NotificationMessage) => {
    console.log('Получено уведомление о новом сообщении:', data);
    
    // Только для операторов
    if (user?.role !== 'OPERATOR') return;
    
    // Проверяем, что это не наше сообщение
    if (data.senderId === user?.id) return;
    
    // Создаем нормализованное сообщение
    const message = {
      _id: data.messageId,
      id: data.messageId,
      text: data.text,
      content: data.text,
      senderId: data.senderId,
      conversationId: data.conversationId,
      createdAt: data.timestamp,
      timestamp: data.timestamp,
      type: 'text',
      status: 'sent',
      senderName: data.senderName,
      readBy: [data.senderId]
    };

    // Обновляем кэш сообщений
    queryClient.setQueryData(
      ['messages', data.conversationId],
      (oldData: any) => {
        if (!oldData) {
          return { data: [message], total: 1 };
        }
        
        const existingMessage = oldData.data.find((m: any) => 
          m._id === message._id || m.id === message.id
        );
        
        if (existingMessage) {
          console.log('Сообщение уже существует в кэше');
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
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        
        return oldData.map((conv: any) => {
          const convId = conv._id || conv.id;
          if (convId === data.conversationId) {
            return {
              ...conv,
              lastMessage: {
                text: data.text,
                senderId: data.senderId,
                timestamp: data.timestamp,
                messageId: data.messageId
              },
              unreadMessagesCount: (conv.unreadMessagesCount || 0) + 1
            };
          }
          return conv;
        });
      }
    );

    // Инвалидируем запросы для принудительного обновления
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    
    // Показываем уведомление (можно добавить toast)
    console.log(`Новое сообщение от ${data.senderName}: ${data.text}`);
    
  }, [user, queryClient]);

  // Подписка на уведомления из backend
  useEffect(() => {
    if (user?.role !== 'OPERATOR') return;

    const eventSource = new EventSource(`/api/operator/notifications?userId=${user.id}`);
    
    eventSource.addEventListener('new-message', (event) => {
      try {
        const data = JSON.parse(event.data);
        handleNewMessageNotification(data);
      } catch (error) {
        console.error('Ошибка парсинга уведомления:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('Ошибка EventSource:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [user?.id, user?.role, handleNewMessageNotification]);

  return {
    // Можно добавить методы для управления уведомлениями
  };
};