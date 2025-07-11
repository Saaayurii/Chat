import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (redisUrl) {
      this.client = createClient({
        url: redisUrl,
      });
    } else {
      // Fallback для локального Redis
      this.client = createClient({
        socket: {
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
        },
        password: this.configService.get<string>('REDIS_PASSWORD'),
        database: this.configService.get<number>('REDIS_DB', 0),
      });
    }

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  // Методы для работы с онлайн статусом пользователей
  async setUserOnline(userId: string, ttl: number = 300): Promise<void> {
    await this.client.setEx(`user:online:${userId}`, ttl, 'true');
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.client.del(`user:online:${userId}`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.client.get(`user:online:${userId}`);
    return result === 'true';
  }

  async getOnlineUsers(): Promise<string[]> {
    const keys = await this.client.keys('user:online:*');
    return keys.map(key => key.replace('user:online:', ''));
  }

  // Методы для работы с сессиями WebSocket
  async setSocketSession(socketId: string, userId: string, ttl: number = 7200): Promise<void> {
    await this.client.setEx(`socket:${socketId}`, ttl, userId);
  }

  async getSocketSession(socketId: string): Promise<string | null> {
    return await this.client.get(`socket:${socketId}`);
  }

  async deleteSocketSession(socketId: string): Promise<void> {
    await this.client.del(`socket:${socketId}`);
  }

  // Методы для работы с активными чатами
  async addUserToChat(chatId: string, userId: string): Promise<void> {
    await this.client.sAdd(`chat:${chatId}:users`, userId);
  }

  async removeUserFromChat(chatId: string, userId: string): Promise<void> {
    await this.client.sRem(`chat:${chatId}:users`, userId);
  }

  async getChatUsers(chatId: string): Promise<string[]> {
    return await this.client.sMembers(`chat:${chatId}:users`);
  }

  async isChatActive(chatId: string): Promise<boolean> {
    const userCount = await this.client.sCard(`chat:${chatId}:users`);
    return userCount > 0;
  }

  // Методы для pub/sub уведомлений
  async publishNotification(channel: string, message: any): Promise<void> {
    await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribeToChannel(channel: string, callback: (message: any) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        this.logger.error('Error parsing message:', error);
      }
    });
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number }> {
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }

  // Геттер для прямого доступа к клиенту (если нужно)
  getClient(): RedisClientType {
    return this.client;
  }
}