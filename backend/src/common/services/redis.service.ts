// src/common/services/redis.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

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

  // Обновленные методы с проверкой подключения
  async setUserOnline(userId: string, ttl: number = 300): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.setEx(`user:online:${userId}`, ttl, 'true');
    } catch (error) {
      this.logger.error('Error setting user online:', error.message);
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.del(`user:online:${userId}`);
    } catch (error) {
      this.logger.error('Error setting user offline:', error.message);
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const client = await this.ensureConnection();
      const result = await client.get(`user:online:${userId}`);
      return result === 'true';
    } catch (error) {
      this.logger.error('Error checking user online status:', error.message);
      return false;
    }
  }

  async getOnlineUsers(): Promise<string[]> {
    try {
      const client = await this.ensureConnection();
      const keys = await client.keys('user:online:*');
      return keys.map(key => key.replace('user:online:', ''));
    } catch (error) {
      this.logger.error('Error getting online users:', error.message);
      return [];
    }
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
      
      const count = Number(results[2]) || 0;
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
}