import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisCompatService } from './redis-compat.service';

export interface NotificationData {
  type: string;
  payload: any;
  timestamp?: number;
  targetUsers?: string[];
  channel?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  ttl?: number;
  metadata?: any;
}

export interface SubscriptionCallback {
  (notification: NotificationData): void | Promise<void>;
}

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private subscribers = new Map<string, Set<SubscriptionCallback>>();
  private redisSubscribers = new Map<string, any>();

  constructor(
    private readonly redisService: RedisService,
    private readonly redisCompatService: RedisCompatService
  ) {}

  async onModuleInit() {
    this.logger.log('NotificationService initialized');
  }

  async onModuleDestroy() {
    // Закрываем все Redis подписки
    for (const [channel, subscriber] of this.redisSubscribers) {
      try {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      } catch (error) {
        this.logger.error(`Error closing Redis subscription for ${channel}:`, error.message);
      }
    }
    this.redisSubscribers.clear();
    this.subscribers.clear();
    this.logger.log('NotificationService destroyed');
  }

  /**
   * Публикует уведомление в канал
   */
  async publish(channel: string, data: NotificationData): Promise<void> {
    try {
      const notification: NotificationData = {
        ...data,
        timestamp: data.timestamp || Date.now(),
        priority: data.priority || 'normal'
      };

      // Публикуем в Redis для распределенной системы
      await this.redisService.publishNotification(channel, notification);

      // Вызываем локальных подписчиков
      await this.notifyLocalSubscribers(channel, notification);

      this.logger.debug(`Notification published to channel ${channel}: ${data.type}`);
    } catch (error) {
      this.logger.error('Error publishing notification:', error.message);
    }
  }

  /**
   * Подписывается на канал уведомлений
   */
  async subscribe(channel: string, callback: SubscriptionCallback): Promise<void> {
    try {
      // Добавляем локальную подписку
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set());
        
        // Создаем Redis подписку только для первого подписчика на канал
        await this.createRedisSubscription(channel);
      }
      
      this.subscribers.get(channel)!.add(callback);
      this.logger.debug(`New subscriber added to channel ${channel}`);
    } catch (error) {
      this.logger.error('Error subscribing to channel:', error.message);
    }
  }

  /**
   * Отписывается от канала
   */
  async unsubscribe(channel: string, callback: SubscriptionCallback): Promise<void> {
    try {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        
        // Если больше нет подписчиков, закрываем Redis подписку
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel);
          await this.closeRedisSubscription(channel);
        }
      }
      this.logger.debug(`Subscriber removed from channel ${channel}`);
    } catch (error) {
      this.logger.error('Error unsubscribing from channel:', error.message);
    }
  }

  /**
   * Публикует уведомление о новом сообщении в чате
   */
  async publishMessageNotification(
    conversationId: string,
    message: any,
    recipientIds: string[]
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'chat.message.new',
      payload: {
        conversationId,
        message: {
          id: message._id || message.id,
          content: message.content || message.text,
          senderId: message.senderId,
          timestamp: message.timestamp || message.createdAt,
          type: message.type
        }
      },
      targetUsers: recipientIds,
      priority: 'normal'
    };

    // Публикуем в общий канал сообщений
    await this.publish('chat.messages', notification);

    // Публикуем в канал конкретной беседы
    await this.publish(`chat.conversation.${conversationId}`, notification);

    // Публикуем в персональные каналы пользователей
    for (const userId of recipientIds) {
      await this.publish(`user.${userId}.notifications`, notification);
    }
  }

  /**
   * Публикует уведомление о статусе набора текста
   */
  async publishTypingNotification(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'chat.typing',
      payload: {
        conversationId,
        userId,
        isTyping
      },
      priority: 'low',
      ttl: 10 // Короткий TTL для typing уведомлений
    };

    await this.publish(`chat.conversation.${conversationId}`, notification);
  }

  /**
   * Публикует уведомление об изменении статуса присутствия
   */
  async publishPresenceNotification(
    userId: string,
    status: string,
    additionalData?: any
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'presence.update',
      payload: {
        userId,
        status,
        lastSeen: Date.now(),
        ...additionalData
      },
      priority: 'low'
    };

    await this.publish('presence.updates', notification);
    await this.publish(`user.${userId}.presence`, notification);
  }

  /**
   * Публикует системное уведомление
   */
  async publishSystemNotification(
    type: string,
    payload: any,
    targetUsers?: string[],
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    const notification: NotificationData = {
      type: `system.${type}`,
      payload,
      targetUsers,
      priority
    };

    if (targetUsers && targetUsers.length > 0) {
      // Отправляем конкретным пользователям
      for (const userId of targetUsers) {
        await this.publish(`user.${userId}.notifications`, notification);
      }
    } else {
      // Отправляем всем (broadcast)
      await this.publish('system.broadcasts', notification);
    }
  }

  /**
   * Публикует уведомление в конкретную беседу через WebSocket
   */
  async publishToConversation(
    conversationId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    const notification: NotificationData = {
      type: eventType,
      payload: payload,
      timestamp: Date.now()
    };

    // Отправляем уведомление в конкретную беседу
    await this.publish(`chat.conversation.${conversationId}`, notification);
  }

  /**
   * Публикует уведомление о передаче чата
   */
  async publishTransferNotification(
    conversationId: string,
    fromOperatorId: string,
    toOperatorId: string,
    reason?: string
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'chat.transfer',
      payload: {
        conversationId,
        fromOperatorId,
        toOperatorId,
        reason,
        timestamp: Date.now()
      },
      targetUsers: [fromOperatorId, toOperatorId],
      priority: 'high'
    };

    await this.publish(`chat.conversation.${conversationId}`, notification);
    await this.publish(`user.${fromOperatorId}.notifications`, notification);
    await this.publish(`user.${toOperatorId}.notifications`, notification);
  }

  /**
   * Публикует уведомление о новой жалобе
   */
  async publishComplaintNotification(
    complaintId: string,
    conversationId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'complaint.new',
      payload: {
        complaintId,
        conversationId,
        reporterId,
        reason,
        timestamp: Date.now()
      },
      priority: 'high'
    };

    // Уведомляем администраторов
    await this.publish('admin.complaints', notification);
  }

  /**
   * Получает статистику подписок
   */
  getSubscriptionStats(): {
    channels: number;
    totalSubscribers: number;
    channelDetails: Array<{ channel: string; subscribers: number }>;
  } {
    const channelDetails = Array.from(this.subscribers.entries()).map(([channel, subscribers]) => ({
      channel,
      subscribers: subscribers.size
    }));

    return {
      channels: this.subscribers.size,
      totalSubscribers: channelDetails.reduce((sum, detail) => sum + detail.subscribers, 0),
      channelDetails
    };
  }

  /**
   * Создает Redis подписку для канала
   */
  private async createRedisSubscription(channel: string): Promise<void> {
    try {
      const subscriber = await this.redisCompatService.safeSubscribe(channel, (message) => {
        this.notifyLocalSubscribers(channel, message);
      });

      if (subscriber) {
        this.redisSubscribers.set(channel, subscriber);
        this.logger.debug(`Redis subscription created for channel ${channel}`);
      } else {
        this.logger.warn(`Failed to create Redis subscription for channel ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Error creating Redis subscription for ${channel}:`, error.message);
    }
  }

  /**
   * Закрывает Redis подписку для канала
   */
  private async closeRedisSubscription(channel: string): Promise<void> {
    try {
      const subscriber = this.redisSubscribers.get(channel);
      if (subscriber) {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
        this.redisSubscribers.delete(channel);
        this.logger.debug(`Redis subscription closed for channel ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Error closing Redis subscription for ${channel}:`, error.message);
    }
  }

  /**
   * Уведомляет локальных подписчиков
   */
  private async notifyLocalSubscribers(channel: string, notification: NotificationData): Promise<void> {
    const subscribers = this.subscribers.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const promises = Array.from(subscribers).map(async (callback) => {
      try {
        await callback(notification);
      } catch (error) {
        this.logger.error(`Error in notification callback for channel ${channel}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Создает отложенное уведомление
   */
  async scheduleNotification(
    channel: string,
    data: NotificationData,
    delayMs: number
  ): Promise<void> {
    setTimeout(async () => {
      await this.publish(channel, data);
    }, delayMs);
  }

  /**
   * Создает периодические уведомления
   */
  createPeriodicNotification(
    channel: string,
    data: NotificationData,
    intervalMs: number
  ): NodeJS.Timeout {
    return setInterval(async () => {
      await this.publish(channel, data);
    }, intervalMs);
  }

  /**
   * Очищает периодические уведомления
   */
  clearPeriodicNotification(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
}