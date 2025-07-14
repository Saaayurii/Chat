// src/common/services/redis.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { PresenceData, PresenceStatus, DeviceTypeString, OnlineUser } from '../interfaces/presence.interface';
import { 
  ensureNumber, 
  ensureString, 
  ensureStringArray, 
  safeParseRedisResult,
  RedisZSetMember 
} from '../interfaces/redis-types.interface';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      
      if (redisUrl) {
        this.logger.log(`Connecting to Redis Cloud: ${redisUrl.replace(/\/\/.*@/, '//***@')}`);
        
        this.client = createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 10000, // 10 секунд
          },
          pingInterval: 30000,
          });
      } else {
        // Fallback для локального Redis
        this.logger.log('Using local Redis configuration');
        this.client = createClient({
          socket: {
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
            connectTimeout: 5000,
          },
          password: this.configService.get<string>('REDIS_PASSWORD'),
          database: this.configService.get<number>('REDIS_DB', 0),
        });
      }

      this.client.on('error', (error) => {
        this.logger.error('Redis connection error:', error.message);
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis reconnecting...');
      });

      this.client.on('end', () => {
        this.logger.warn('Redis connection ended');
      });

      // Подключаемся к Redis
      await this.client.connect();
      
      // Тестируем соединение
      await this.client.ping();
      this.logger.log('Redis ping successful');
      
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      // Не выбрасываем ошибку, позволяем приложению работать
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.disconnect();
        this.logger.log('Redis client disconnected');
      } catch (error) {
        this.logger.error('Error disconnecting Redis:', error.message);
      }
    }
  }

  // Проверка подключения перед операциями
  private async ensureConnection(): Promise<RedisClientType> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    
    if (!this.client.isReady) {
      this.logger.warn('Redis not ready, attempting to reconnect...');
      await this.client.connect();
    }
    
    return this.client;
  }

  // Расширенные методы для системы присутствия
  async setUserPresence(userId: string, presenceData: PresenceData, ttl: number = 300): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const presenceInfo = {
        ...presenceData,
        updatedAt: Date.now(),
        ttl
      };
      
      // Сохраняем расширенную информацию о присутствии
      await client.setEx(`presence:${userId}`, ttl, JSON.stringify(presenceInfo));
      
      // Сохраняем в sorted set для быстрого получения списка онлайн пользователей
      if (presenceData.status === PresenceStatus.ONLINE) {
        await client.zAdd('presence:online', { score: Date.now(), value: userId });
      } else {
        await client.zRem('presence:online', userId);
      }
      
      // Сохраняем историю активности
      await client.lPush(`presence:history:${userId}`, JSON.stringify({
        status: presenceData.status,
        timestamp: Date.now(),
        deviceType: presenceData.deviceType
      }));
      
      // Ограничиваем историю последними 100 записями
      await client.lTrim(`presence:history:${userId}`, 0, 99);
      
    } catch (error) {
      this.logger.error('Error setting user presence:', error.message);
    }
  }

  async getUserPresence(userId: string): Promise<PresenceData | null> {
    try {
      const client = await this.ensureConnection();
      const presenceData = await client.get(`presence:${userId}`);
      
      if (presenceData) {
        return JSON.parse(presenceData);
      }
      
      // Если нет данных о присутствии, возвращаем offline статус
      return {
        status: PresenceStatus.OFFLINE,
        lastSeen: Date.now() - 300000 // 5 минут назад
      };
    } catch (error) {
      this.logger.error('Error getting user presence:', error.message);
      return {
        status: PresenceStatus.OFFLINE,
        lastSeen: Date.now()
      };
    }
  }

  async getMultipleUserPresence(userIds: string[]): Promise<{[userId: string]: any}> {
    try {
      const client = await this.ensureConnection();
      const pipeline = client.multi();
      
      userIds.forEach(userId => {
        pipeline.get(`presence:${userId}`);
      });
      
      const results = await pipeline.exec();
      const presenceMap: {[userId: string]: any} = {};
      
      userIds.forEach((userId, index) => {
        const presenceData = results?.[index];
        if (presenceData && typeof presenceData === 'string') {
          try {
            presenceMap[userId] = JSON.parse(presenceData);
          } catch (error) {
            presenceMap[userId] = {
              status: PresenceStatus.OFFLINE,
              lastSeen: Date.now() - 300000
            };
          }
        } else {
          presenceMap[userId] = {
            status: PresenceStatus.OFFLINE,
            lastSeen: Date.now() - 300000
          };
        }
      });
      
      return presenceMap;
    } catch (error) {
      this.logger.error('Error getting multiple user presence:', error.message);
      return {};
    }
  }

  async getOnlineUsers(limit: number = 100): Promise<OnlineUser[]> {
    try {
      const client = await this.ensureConnection();
      
      // Получаем онлайн пользователей из sorted set
      const onlineUserIds = await client.zRange('presence:online', 0, limit - 1);
      
      if (onlineUserIds.length === 0) {
        return [];
      }
      
      // Получаем подробную информацию о каждом пользователе
      const presenceData = await this.getMultipleUserPresence(onlineUserIds);
      
      return onlineUserIds.map(userId => ({
        userId,
        lastSeen: presenceData[userId]?.lastSeen || Date.now(),
        status: presenceData[userId]?.status || PresenceStatus.OFFLINE,
        deviceType: presenceData[userId]?.deviceType,
        activity: presenceData[userId]?.activity
      }));
      
    } catch (error) {
      this.logger.error('Error getting online users:', error.message);
      return [];
    }
  }

  async getUserPresenceHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const client = await this.ensureConnection();
      const history = await client.lRange(`presence:history:${userId}`, 0, limit - 1);
      return history.map(item => JSON.parse(item));
    } catch (error) {
      this.logger.error('Error getting user presence history:', error.message);
      return [];
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      
      // Удаляем из онлайн списка
      await client.zRem('presence:online', userId);
      
      // Обновляем статус на offline
      const currentPresence = await this.getUserPresence(userId);
      if (currentPresence) {
        await this.setUserPresence(userId, {
          ...currentPresence,
          status: PresenceStatus.OFFLINE,
          lastSeen: Date.now()
        }, 86400); // Храним offline статус 24 часа
      }
      
    } catch (error) {
      this.logger.error('Error setting user offline:', error.message);
    }
  }

  // Для обратной совместимости
  async setUserOnline(userId: string, ttl: number = 300): Promise<void> {
    await this.setUserPresence(userId, {
      status: PresenceStatus.ONLINE,
      lastSeen: Date.now(),
      deviceType: 'desktop'
    }, ttl);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const presence = await this.getUserPresence(userId);
    return presence?.status === PresenceStatus.ONLINE;
  }

  // Остальные методы аналогично обновите...
  async setSocketSession(socketId: string, userId: string, ttl: number = 7200): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.setEx(`socket:${socketId}`, ttl, userId);
    } catch (error) {
      this.logger.error('Error setting socket session:', error.message);
    }
  }

  async getSocketSession(socketId: string): Promise<string | null> {
    try {
      const client = await this.ensureConnection();
      return await client.get(`socket:${socketId}`);
    } catch (error) {
      this.logger.error('Error getting socket session:', error.message);
      return null;
    }
  }

  async deleteSocketSession(socketId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.del(`socket:${socketId}`);
    } catch (error) {
      this.logger.error('Error deleting socket session:', error.message);
    }
  }

  // Методы для работы с активными чатами
  async addUserToChat(chatId: string, userId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.sAdd(`chat:${chatId}:users`, userId);
    } catch (error) {
      this.logger.error('Error adding user to chat:', error.message);
    }
  }

  async removeUserFromChat(chatId: string, userId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.sRem(`chat:${chatId}:users`, userId);
    } catch (error) {
      this.logger.error('Error removing user from chat:', error.message);
    }
  }

  async getChatUsers(chatId: string): Promise<string[]> {
    try {
      const client = await this.ensureConnection();
      return await client.sMembers(`chat:${chatId}:users`);
    } catch (error) {
      this.logger.error('Error getting chat users:', error.message);
      return [];
    }
  }

  async isChatActive(chatId: string): Promise<boolean> {
    try {
      const client = await this.ensureConnection();
      const userCount = await client.sCard(`chat:${chatId}:users`);
      return userCount > 0;
    } catch (error) {
      this.logger.error('Error checking chat activity:', error.message);
      return false;
    }
  }

  // Геттер для прямого доступа к клиенту
  getClient(): RedisClientType | null {
    return this.client;
  }

  // Проверка здоровья Redis
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.client.isReady) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Метод для проверки лимитов запросов
  async checkRateLimit(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const client = await this.ensureConnection();
      
      const now = Date.now();
      const windowStart = now - window * 1000;
      
      // Используем sorted set для хранения timestamps запросов
      const pipe = client.multi();
      
      // Удаляем старые записи
      pipe.zRemRangeByScore(key, '-inf', windowStart);
      
      // Добавляем текущий запрос
      pipe.zAdd(key, { score: now, value: now.toString() });
      
      // Подсчитываем количество запросов в окне
      pipe.zCard(key);
      
      // Устанавливаем TTL для ключа
      pipe.expire(key, window);
      
      const results = await pipe.exec();
      
      if (!results || results.length < 3) {
        return { allowed: false, remaining: 0, resetTime: now + window * 1000 };
      }
      
      // Результат zCard находится в третьем элементе результата
      const countResult = results[2];
      const count = typeof countResult === 'number' ? countResult : Number(countResult) || 0;
      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = now + window * 1000;
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      this.logger.error('Error checking rate limit:', error.message);
      // В случае ошибки разрешаем запрос
      return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 };
    }
  }

  // ============================================
  // МЕТОДЫ ДЛЯ PUB/SUB УВЕДОМЛЕНИЙ
  // ============================================

  /**
   * Публикует уведомление в канал
   */
  async publishNotification(channel: string, data: any): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.publish(channel, JSON.stringify({
        ...data,
        timestamp: Date.now(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      this.logger.debug(`Notification published to channel ${channel}`);
    } catch (error) {
      this.logger.error('Error publishing notification:', error.message);
    }
  }

  /**
   * Подписывается на канал уведомлений
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      // Создаем отдельный клиент для подписки
      const subscriber = this.client?.duplicate();
      if (!subscriber) {
        throw new Error('Redis client not available');
      }

      if (!subscriber.isOpen) {
        await subscriber.connect();
      }
      
      // Настраиваем обработчик сообщений
      await subscriber.subscribe(channel, (message: string, channelName: string) => {
        if (channelName === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            this.logger.error('Error parsing subscription message:', error.message);
          }
        }
      });
      
      this.logger.log(`Subscribed to channel ${channel}`);
    } catch (error) {
      this.logger.error('Error subscribing to channel:', error.message);
    }
  }

  /**
   * Публикует уведомление о новом сообщении
   */
  async publishMessageNotification(conversationId: string, message: any, recipientIds: string[]): Promise<void> {
    try {
      const notification = {
        type: 'new_message',
        conversationId,
        message: {
          id: message._id || message.id,
          content: message.content || message.text,
          senderId: message.senderId,
          timestamp: message.timestamp || message.createdAt
        },
        recipientIds
      };

      // Публикуем в общий канал сообщений
      await this.publishNotification('chat:messages', notification);

      // Публикуем в персональные каналы пользователей
      for (const userId of recipientIds) {
        await this.publishNotification(`user:${userId}:notifications`, notification);
      }
    } catch (error) {
      this.logger.error('Error publishing message notification:', error.message);
    }
  }

  /**
   * Публикует уведомление о статусе набора
   */
  async publishTypingNotification(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const notification = {
        type: 'typing',
        conversationId,
        userId,
        isTyping,
        timestamp: Date.now()
      };

      await this.publishNotification(`chat:${conversationId}:typing`, notification);
    } catch (error) {
      this.logger.error('Error publishing typing notification:', error.message);
    }
  }

  /**
   * Публикует уведомление об изменении статуса присутствия
   */
  async publishPresenceNotification(userId: string, status: PresenceStatus, additionalData?: any): Promise<void> {
    try {
      const notification = {
        type: 'presence_update',
        userId,
        status,
        lastSeen: Date.now(),
        ...additionalData
      };

      await this.publishNotification('presence:updates', notification);
      await this.publishNotification(`user:${userId}:presence`, notification);
    } catch (error) {
      this.logger.error('Error publishing presence notification:', error.message);
    }
  }

  // ============================================
  // МЕТОДЫ ДЛЯ КЭШИРОВАНИЯ ПОЛЬЗОВАТЕЛЬСКИХ ДАННЫХ
  // ============================================

  /**
   * Кэширует данные пользователя
   */
  async cacheUser(userId: string, userData: any, ttl: number = 3600): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const userKey = `user:${userId}:profile`;
      
      const cachedData = {
        ...userData,
        cachedAt: Date.now(),
        _id: userData._id || userData.id
      };

      await client.setEx(userKey, ttl, JSON.stringify(cachedData));
      this.logger.debug(`User data cached for user ${userId}`);
    } catch (error) {
      this.logger.error('Error caching user data:', error.message);
    }
  }

  /**
   * Получает кэшированные данные пользователя
   */
  async getCachedUser(userId: string): Promise<any | null> {
    try {
      const client = await this.ensureConnection();
      const userKey = `user:${userId}:profile`;
      const userData = await client.get(userKey);
      
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      this.logger.error('Error getting cached user:', error.message);
      return null;
    }
  }

  /**
   * Кэширует сессию пользователя
   */
  async cacheUserSession(sessionId: string, sessionData: any, ttl: number = 7200): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const sessionKey = `session:${sessionId}`;
      
      const cachedSession = {
        ...sessionData,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000)
      };

      await client.setEx(sessionKey, ttl, JSON.stringify(cachedSession));
      this.logger.debug(`Session cached for session ${sessionId}`);
    } catch (error) {
      this.logger.error('Error caching session:', error.message);
    }
  }

  /**
   * Получает кэшированную сессию
   */
  async getCachedSession(sessionId: string): Promise<any | null> {
    try {
      const client = await this.ensureConnection();
      const sessionKey = `session:${sessionId}`;
      const sessionData = await client.get(sessionKey);
      
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      this.logger.error('Error getting cached session:', error.message);
      return null;
    }
  }

  /**
   * Удаляет сессию из кэша
   */
  async deleteCachedSession(sessionId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const sessionKey = `session:${sessionId}`;
      await client.del(sessionKey);
      this.logger.debug(`Session deleted for session ${sessionId}`);
    } catch (error) {
      this.logger.error('Error deleting session:', error.message);
    }
  }

  // ============================================
  // СИСТЕМА ОЧЕРЕДЕЙ ДЛЯ ОБРАБОТКИ СООБЩЕНИЙ
  // ============================================

  /**
   * Добавляет задачу в очередь
   */
  async enqueueTask(queueName: string, taskData: any, priority: number = 0): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: taskData,
        createdAt: Date.now(),
        priority,
        attempts: 0,
        maxAttempts: 3
      };

      // Используем sorted set для приоритетной очереди
      await client.zAdd(`queue:${queueName}`, { score: priority, value: JSON.stringify(task) });
      this.logger.debug(`Task enqueued to ${queueName} with priority ${priority}`);
    } catch (error) {
      this.logger.error('Error enqueuing task:', error.message);
    }
  }

  /**
   * Получает задачу из очереди
   */
  async dequeueTask(queueName: string): Promise<any | null> {
    try {
      const client = await this.ensureConnection();
      
      // Получаем задачу с наивысшим приоритетом
      const result = await client.zPopMax(`queue:${queueName}`);
      
      if (result && Array.isArray(result) && result.length > 0) {
        // zPopMax возвращает массив объектов {value, score}
        const task = result[0];
        return JSON.parse(task.value);
      } else if (result && typeof result === 'object' && 'value' in result) {
        // Если возвращается один объект
        return JSON.parse(result.value);
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error dequeuing task:', error.message);
      return null;
    }
  }

  /**
   * Получает размер очереди
   */
  async getQueueSize(queueName: string): Promise<number> {
    try {
      const client = await this.ensureConnection();
      return await client.zCard(`queue:${queueName}`);
    } catch (error) {
      this.logger.error('Error getting queue size:', error.message);
      return 0;
    }
  }

  /**
   * Обрабатывает неудачную задачу (retry mechanism)
   */
  async requeueFailedTask(queueName: string, task: any): Promise<void> {
    try {
      if (task.attempts < task.maxAttempts) {
        task.attempts++;
        task.retriedAt = Date.now();
        // Снижаем приоритет для повторных попыток
        const newPriority = Math.max(0, task.priority - task.attempts);
        await this.enqueueTask(queueName, task, newPriority);
      } else {
        // Перемещаем в очередь неудачных задач
        await this.enqueueTask(`${queueName}:failed`, task, 0);
        this.logger.warn(`Task ${task.id} moved to failed queue after ${task.attempts} attempts`);
      }
    } catch (error) {
      this.logger.error('Error requeuing failed task:', error.message);
    }
  }

  // ============================================
  // АНАЛИТИКА И МЕТРИКИ ЧАТА
  // ============================================

  /**
   * Увеличивает счетчик метрики
   */
  async incrementMetric(metricName: string, value: number = 1): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();
      
      // Дневная метрика
      await client.incrBy(`metrics:${metricName}:${today}`, value);
      
      // Почасовая метрика
      await client.incrBy(`metrics:${metricName}:${today}:${hour}`, value);
      
      // Общая метрика
      await client.incrBy(`metrics:${metricName}:total`, value);
      
      // Устанавливаем TTL для дневных метрик (30 дней)
      await client.expire(`metrics:${metricName}:${today}`, 30 * 24 * 60 * 60);
      await client.expire(`metrics:${metricName}:${today}:${hour}`, 30 * 24 * 60 * 60);
    } catch (error) {
      this.logger.error('Error incrementing metric:', error.message);
    }
  }

  /**
   * Получает значение метрики
   */
  async getMetric(metricName: string, date?: string): Promise<number> {
    try {
      const client = await this.ensureConnection();
      const targetDate = date || new Date().toISOString().split('T')[0];
      const value = await client.get(`metrics:${metricName}:${targetDate}`);
      return parseInt(value || '0', 10);
    } catch (error) {
      this.logger.error('Error getting metric:', error.message);
      return 0;
    }
  }

  /**
   * Получает метрики за период
   */
  async getMetricsRange(metricName: string, startDate: string, endDate: string): Promise<{[date: string]: number}> {
    try {
      const client = await this.ensureConnection();
      const pipeline = client.multi();
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: string[] = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        pipeline.get(`metrics:${metricName}:${dateStr}`);
      }
      
      const results = await pipeline.exec();
      const metrics: {[date: string]: number} = {};
      
      dates.forEach((date, index) => {
        const value = results?.[index];
        const stringValue = typeof value === 'string' ? value : String(value || '0');
        metrics[date] = parseInt(stringValue, 10);
      });
      
      return metrics;
    } catch (error) {
      this.logger.error('Error getting metrics range:', error.message);
      return {};
    }
  }

  /**
   * Записывает пользовательскую активность
   */
  async recordUserActivity(userId: string, activity: string, metadata?: any): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const activityData = {
        userId,
        activity,
        timestamp: Date.now(),
        metadata: metadata || {}
      };
      
      // Добавляем в список активности пользователя
      await client.lPush(`activity:${userId}`, JSON.stringify(activityData));
      
      // Ограничиваем историю активности
      await client.lTrim(`activity:${userId}`, 0, 999);
      
      // Увеличиваем счетчик активности
      await this.incrementMetric(`activity:${activity}`);
      await this.incrementMetric(`user_activity:${userId}`);
    } catch (error) {
      this.logger.error('Error recording user activity:', error.message);
    }
  }

  /**
   * Получает активность пользователя
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const client = await this.ensureConnection();
      const activities = await client.lRange(`activity:${userId}`, 0, limit - 1);
      return activities.map(activity => JSON.parse(activity));
    } catch (error) {
      this.logger.error('Error getting user activity:', error.message);
      return [];
    }
  }

  // ============================================
  // ВРЕМЕННОЕ ХРАНЕНИЕ ФАЙЛОВ И МЕДИА
  // ============================================

  /**
   * Сохраняет временный файл
   */
  async storeTempFile(fileId: string, fileData: Buffer, metadata: any, ttl: number = 3600): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const fileKey = `temp:file:${fileId}`;
      const metaKey = `temp:meta:${fileId}`;
      
      // Сохраняем данные файла
      await client.setEx(fileKey, ttl, fileData.toString('base64'));
      
      // Сохраняем метаданные
      await client.setEx(metaKey, ttl, JSON.stringify({
        ...metadata,
        uploadedAt: Date.now(),
        size: fileData.length
      }));
      
      this.logger.debug(`Temp file ${fileId} stored for ${ttl} seconds`);
    } catch (error) {
      this.logger.error('Error storing temp file:', error.message);
    }
  }

  /**
   * Получает временный файл
   */
  async getTempFile(fileId: string): Promise<{data: Buffer; metadata: any} | null> {
    try {
      const client = await this.ensureConnection();
      const fileKey = `temp:file:${fileId}`;
      const metaKey = `temp:meta:${fileId}`;
      
      const [fileData, metadata] = await Promise.all([
        client.get(fileKey),
        client.get(metaKey)
      ]);
      
      if (fileData && metadata) {
        return {
          data: Buffer.from(fileData, 'base64'),
          metadata: JSON.parse(metadata)
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error getting temp file:', error.message);
      return null;
    }
  }

  /**
   * Удаляет временный файл
   */
  async deleteTempFile(fileId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const fileKey = `temp:file:${fileId}`;
      const metaKey = `temp:meta:${fileId}`;
      
      await Promise.all([
        client.del(fileKey),
        client.del(metaKey)
      ]);
      
      this.logger.debug(`Temp file ${fileId} deleted`);
    } catch (error) {
      this.logger.error('Error deleting temp file:', error.message);
    }
  }

  /**
   * Очищает устаревшие временные файлы
   */
  async cleanupExpiredTempFiles(): Promise<number> {
    try {
      const client = await this.ensureConnection();
      let cleaned = 0;
      
      // Эта операция требует осторожности в production
      // Лучше использовать отдельный процесс для очистки
      const keys = await client.keys('temp:*');
      
      for (const key of keys) {
        const ttl = await client.ttl(key);
        if (ttl === -1 || ttl === 0) {
          await client.del(key);
          cleaned++;
        }
      }
      
      this.logger.debug(`Cleaned up ${cleaned} expired temp files`);
      return cleaned;
    } catch (error) {
      this.logger.error('Error cleaning up temp files:', error.message);
      return 0;
    }
  }

  // ============================================
  // МЕТОДЫ ДЛЯ КЭШИРОВАНИЯ СООБЩЕНИЙ ЧАТА
  // ============================================

  /**
   * Добавляет сообщение в кэш чата
   * Использует Redis List для хранения последних сообщений
   */
  async cacheMessage(conversationId: string, message: any, maxMessages: number = 100): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      
      // Сериализуем сообщение с метаданными для кэша
      const cachedMessage = {
        ...message,
        cachedAt: Date.now(),
        _id: message._id || message.id
      };
      
      // Добавляем сообщение в начало списка (последние сообщения)
      await client.lPush(messageKey, JSON.stringify(cachedMessage));
      
      // Ограничиваем количество сохраненных сообщений
      await client.lTrim(messageKey, 0, maxMessages - 1);
      
      // Устанавливаем TTL для кэша (7 дней)
      await client.expire(messageKey, 7 * 24 * 60 * 60);
      
      this.logger.debug(`Message cached for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Error caching message:', error.message);
    }
  }

  /**
   * Получает кэшированные сообщения для чата
   */
  async getCachedMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      
      // Получаем сообщения из списка (reverse order для правильной хронологии)
      const messages = await client.lRange(messageKey, offset, offset + limit - 1);
      
      return messages.map(msg => JSON.parse(msg)).reverse(); // Возвращаем в хронологическом порядке
    } catch (error) {
      this.logger.error('Error getting cached messages:', error.message);
      return [];
    }
  }

  /**
   * Проверяет количество кэшированных сообщений
   */
  async getCachedMessageCount(conversationId: string): Promise<number> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      return await client.lLen(messageKey);
    } catch (error) {
      this.logger.error('Error getting cached message count:', error.message);
      return 0;
    }
  }

  /**
   * Очищает кэш сообщений для чата
   */
  async clearMessageCache(conversationId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      await client.del(messageKey);
      this.logger.debug(`Message cache cleared for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Error clearing message cache:', error.message);
    }
  }

  /**
   * Предварительно загружает сообщения в кэш из базы данных
   */
  async preloadMessageCache(conversationId: string, messages: any[], maxMessages: number = 100): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      
      // Очищаем существующий кэш
      await client.del(messageKey);
      
      // Добавляем сообщения в обратном порядке (самые новые первыми)
      const reversedMessages = messages.reverse();
      for (const message of reversedMessages) {
        const cachedMessage = {
          ...message,
          cachedAt: Date.now(),
          _id: message._id || message.id
        };
        await client.lPush(messageKey, JSON.stringify(cachedMessage));
      }
      
      // Ограничиваем количество
      await client.lTrim(messageKey, 0, maxMessages - 1);
      
      // Устанавливаем TTL
      await client.expire(messageKey, 7 * 24 * 60 * 60);
      
      this.logger.debug(`Preloaded ${messages.length} messages for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Error preloading message cache:', error.message);
    }
  }

  /**
   * Получает метаданные кэша сообщений
   */
  async getMessageCacheInfo(conversationId: string): Promise<{
    messageCount: number;
    lastCached: number | null;
    ttl: number;
  }> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      
      const [messageCount, ttl] = await Promise.all([
        client.lLen(messageKey),
        client.ttl(messageKey)
      ]);
      
      // Получаем последнее кэшированное сообщение для определения времени
      let lastCached: number | null = null;
      if (messageCount > 0) {
        const lastMessage = await client.lIndex(messageKey, 0);
        if (lastMessage) {
          const parsed = JSON.parse(lastMessage);
          lastCached = parsed.cachedAt;
        }
      }
      
      return {
        messageCount,
        lastCached,
        ttl: ttl > 0 ? ttl : 0
      };
    } catch (error) {
      this.logger.error('Error getting message cache info:', error.message);
      return { messageCount: 0, lastCached: null, ttl: 0 };
    }
  }

  /**
   * Обновляет сообщение в кэше (например, при редактировании)
   */
  async updateCachedMessage(conversationId: string, messageId: string, updatedMessage: any): Promise<boolean> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      
      // Получаем все сообщения
      const messages = await client.lRange(messageKey, 0, -1);
      
      // Находим и обновляем нужное сообщение
      let updated = false;
      const updatedMessages = messages.map(msgStr => {
        const msg = JSON.parse(msgStr);
        if (msg._id === messageId || msg.id === messageId) {
          updated = true;
          return JSON.stringify({
            ...msg,
            ...updatedMessage,
            updatedAt: Date.now(),
            _id: msg._id || msg.id
          });
        }
        return msgStr;
      });
      
      if (updated) {
        // Пересоздаем список с обновленными сообщениями
        await client.del(messageKey);
        for (const msgStr of updatedMessages) {
          await client.rPush(messageKey, msgStr);
        }
        
        // Восстанавливаем TTL
        await client.expire(messageKey, 7 * 24 * 60 * 60);
        
        this.logger.debug(`Message ${messageId} updated in cache for conversation ${conversationId}`);
      }
      
      return updated;
    } catch (error) {
      this.logger.error('Error updating cached message:', error.message);
      return false;
    }
  }

  /**
   * Удаляет сообщение из кэша
   */
  async deleteCachedMessage(conversationId: string, messageId: string): Promise<boolean> {
    try {
      const client = await this.ensureConnection();
      const messageKey = `chat:${conversationId}:messages`;
      
      // Получаем все сообщения
      const messages = await client.lRange(messageKey, 0, -1);
      
      // Фильтруем сообщения, исключая удаляемое
      let deleted = false;
      const filteredMessages = messages.filter(msgStr => {
        const msg = JSON.parse(msgStr);
        if (msg._id === messageId || msg.id === messageId) {
          deleted = true;
          return false;
        }
        return true;
      });
      
      if (deleted) {
        // Пересоздаем список без удаленного сообщения
        await client.del(messageKey);
        for (const msgStr of filteredMessages) {
          await client.rPush(messageKey, msgStr);
        }
        
        // Восстанавливаем TTL
        await client.expire(messageKey, 7 * 24 * 60 * 60);
        
        this.logger.debug(`Message ${messageId} deleted from cache for conversation ${conversationId}`);
      }
      
      return deleted;
    } catch (error) {
      this.logger.error('Error deleting cached message:', error.message);
      return false;
    }
  }
}