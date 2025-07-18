import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface MessageCacheConfig {
  maxMessagesPerChat: number;
  cacheEnabled: boolean;
  preloadMessageCount: number;
  cacheTtlDays: number;
}

export interface CachedMessage {
  _id: string;
  content: string;
  senderId: string;
  conversationId: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  attachments?: string[];
  isRead: boolean;
  cachedAt?: number;
  updatedAt?: Date;
}

@Injectable()
export class MessageCacheService {
  private readonly logger = new Logger(MessageCacheService.name);
  
  private readonly config: MessageCacheConfig = {
    maxMessagesPerChat: 100,
    cacheEnabled: false, // ВРЕМЕННО отключаем кеш
    preloadMessageCount: 50,
    cacheTtlDays: 7
  };

  constructor(private readonly redisService: RedisService) {}

  /**
   * Получает сообщения чата с приоритетом кэша
   * Сначала проверяет кэш, если недостаточно данных - обращается к БД
   */
  async getMessages(
    conversationId: string, 
    limit: number = 20, 
    offset: number = 0,
    fallbackFn?: (conversationId: string, limit: number, offset: number) => Promise<any[]>
  ): Promise<{
    messages: CachedMessage[];
    fromCache: boolean;
    cacheInfo: {
      totalCached: number;
      lastCached: number | null;
    };
  }> {
    if (!this.config.cacheEnabled) {
      const messages = fallbackFn ? await fallbackFn(conversationId, limit, offset) : [];
      return {
        messages: messages.map(this.transformToCache),
        fromCache: false,
        cacheInfo: { totalCached: 0, lastCached: null }
      };
    }

    try {
      // Получаем информацию о кэше
      const cacheInfo = await this.redisService.getMessageCacheInfo(conversationId);
      
      // ВРЕМЕННО: Принудительно пропускаем кеш и идем в БД
      // TODO: Убрать после того как весь кеш будет обновлен
      this.logger.debug(`Temporarily bypassing cache for conversation ${conversationId}`);
      
      // Проверяем, есть ли сообщения в кэше (для старой логики)
      // const availableInCache = Math.max(0, cacheInfo.messageCount - offset);

      // if (availableInCache > 0) {
      //   // Получаем сообщения из кэша (столько сколько есть или сколько нужно)
      //   const cachedMessages = await this.redisService.getCachedMessages(
      //     conversationId, 
      //     Math.min(limit, availableInCache), 
      //     offset
      //   );

      //   this.logger.debug(`Served ${cachedMessages.length} messages from cache for conversation ${conversationId}`);
      //   this.logger.debug(`First cached message: ${JSON.stringify(cachedMessages[0])}`);
      //   
      //   // Обеспечиваем совместимость для старых кешированных сообщений
      //   const processedMessages = cachedMessages.map(msg => ({
      //     ...msg,
      //     content: msg.content || msg.text, // Добавляем content если его нет
      //     text: msg.text || msg.content     // Добавляем text если его нет
      //   }));

      //   return {
      //     messages: processedMessages,
      //     fromCache: true,
      //     cacheInfo: {
      //       totalCached: cacheInfo.messageCount,
      //       lastCached: cacheInfo.lastCached
      //     }
      //   };
      // }

      // Если в кэше недостаточно сообщений, обращаемся к БД
      if (fallbackFn) {
        // ВРЕМЕННО: Принудительно очищаем кеш и загружаем из БД
        this.logger.debug(`Clearing cache and forcing DB fallback for conversation ${conversationId}`);
        await this.clearCache(conversationId);
        
        const dbMessages = await fallbackFn(conversationId, limit, offset);
        
        this.logger.debug(`Served ${dbMessages.length} messages from DB for conversation ${conversationId}`);
        this.logger.debug(`First DB message: ${JSON.stringify(dbMessages[0])}`);
        
        const transformedMessages = dbMessages.map(this.transformToCache);
        this.logger.debug(`First transformed message: ${JSON.stringify(transformedMessages[0])}`);
        
        // Если это первый запрос (offset = 0), обновляем кэш с правильными данными
        if (offset === 0 && transformedMessages.length > 0) {
          await this.preloadMessages(conversationId, transformedMessages);
        }
        
        return {
          messages: transformedMessages,
          fromCache: false,
          cacheInfo: {
            totalCached: 0, // Кеш очищен
            lastCached: null
          }
        };
      }

      // Fallback не предоставлен, возвращаем пустой массив
      return {
        messages: [],
        fromCache: false,
        cacheInfo: {
          totalCached: 0,
          lastCached: null
        }
      };

    } catch (error) {
      this.logger.error('Error getting messages with cache:', error.message);
      
      // В случае ошибки обращаемся к БД
      if (fallbackFn) {
        const messages = await fallbackFn(conversationId, limit, offset);
        return {
          messages: messages.map(this.transformToCache),
          fromCache: false,
          cacheInfo: { totalCached: 0, lastCached: null }
        };
      }

      return {
        messages: [],
        fromCache: false,
        cacheInfo: { totalCached: 0, lastCached: null }
      };
    }
  }

  /**
   * Добавляет новое сообщение в кэш
   */
  async addMessage(message: any): Promise<void> {
    if (!this.config.cacheEnabled) return;

    try {
      await this.redisService.cacheMessage(
        message.conversationId,
        this.transformToCache(message),
        this.config.maxMessagesPerChat
      );
      
      this.logger.debug(`Message ${message._id} added to cache for conversation ${message.conversationId}`);
    } catch (error) {
      this.logger.error('Error adding message to cache:', error.message);
    }
  }

  /**
   * Обновляет сообщение в кэше
   */
  async updateMessage(conversationId: string, messageId: string, updates: Partial<any>): Promise<boolean> {
    if (!this.config.cacheEnabled) return false;

    try {
      const success = await this.redisService.updateCachedMessage(
        conversationId,
        messageId,
        updates
      );
      
      if (success) {
        this.logger.debug(`Message ${messageId} updated in cache for conversation ${conversationId}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error updating message in cache:', error.message);
      return false;
    }
  }

  /**
   * Удаляет сообщение из кэша
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<boolean> {
    if (!this.config.cacheEnabled) return false;

    try {
      const success = await this.redisService.deleteCachedMessage(conversationId, messageId);
      
      if (success) {
        this.logger.debug(`Message ${messageId} deleted from cache for conversation ${conversationId}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error deleting message from cache:', error.message);
      return false;
    }
  }

  /**
   * Предварительно загружает сообщения в кэш
   */
  async preloadMessages(conversationId: string, messages: any[]): Promise<void> {
    if (!this.config.cacheEnabled) return;

    try {
      const transformedMessages = messages.map(this.transformToCache);
      await this.redisService.preloadMessageCache(
        conversationId,
        transformedMessages,
        this.config.maxMessagesPerChat
      );
      
      this.logger.debug(`Preloaded ${messages.length} messages for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Error preloading messages:', error.message);
    }
  }

  /**
   * Очищает кэш для чата
   */
  async clearCache(conversationId: string): Promise<void> {
    if (!this.config.cacheEnabled) return;

    try {
      await this.redisService.clearMessageCache(conversationId);
      this.logger.debug(`Cache cleared for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Error clearing cache:', error.message);
    }
  }

  /**
   * Получает статистику кэша
   */
  async getCacheStats(conversationId: string): Promise<{
    messageCount: number;
    lastCached: number | null;
    ttl: number;
    isEnabled: boolean;
  }> {
    if (!this.config.cacheEnabled) {
      return {
        messageCount: 0,
        lastCached: null,
        ttl: 0,
        isEnabled: false
      };
    }

    try {
      const info = await this.redisService.getMessageCacheInfo(conversationId);
      return {
        ...info,
        isEnabled: true
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error.message);
      return {
        messageCount: 0,
        lastCached: null,
        ttl: 0,
        isEnabled: true
      };
    }
  }

  /**
   * Массовая очистка устаревших кэшей
   */
  async cleanupExpiredCaches(): Promise<number> {
    if (!this.config.cacheEnabled) return 0;

    try {
      // Это более сложная операция, которая требует сканирования всех ключей
      // В production лучше использовать отдельный процесс для очистки
      this.logger.debug('Starting cache cleanup...');
      
      // Здесь можно добавить логику очистки старых кэшей
      // Например, сканирование ключей chat:*:messages и проверка TTL
      
      return 0; // Возвращаем количество очищенных кэшей
    } catch (error) {
      this.logger.error('Error during cache cleanup:', error.message);
      return 0;
    }
  }

  /**
   * Обновляет конфигурацию кэша
   */
  updateConfig(newConfig: Partial<MessageCacheConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log(`Cache config updated: ${JSON.stringify(this.config)}`);
  }

  /**
   * Получает текущую конфигурацию
   */
  getConfig(): MessageCacheConfig {
    return { ...this.config };
  }

  /**
   * Приватный метод для трансформации сообщения в формат кэша
   */
  private transformToCache(message: any): CachedMessage {
    return {
      _id: message._id || message.id,
      content: message.content || message.text,
      senderId: message.senderId || message.sender?.id,
      conversationId: message.conversationId,
      timestamp: message.timestamp || message.createdAt,
      type: message.type || 'text',
      attachments: message.attachments,
      isRead: message.isRead || false,
      cachedAt: message.cachedAt || Date.now(),
      updatedAt: message.updatedAt
    };
  }
}