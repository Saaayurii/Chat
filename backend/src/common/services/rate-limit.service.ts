import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RateLimitConfig {
  windowMs: number; // Время окна в миллисекундах
  maxRequests: number; // Максимальное количество запросов в окне
  skipSuccessfulRequests?: boolean; // Не считать успешные запросы
  skipFailedRequests?: boolean; // Не считать неудачные запросы
  keyGenerator?: (identifier: string) => string; // Функция генерации ключа
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  // Предустановленные конфигурации
  private readonly presets = {
    // API запросы
    api: {
      windowMs: 15 * 60 * 1000, // 15 минут
      maxRequests: 100
    },
    // Отправка сообщений
    messages: {
      windowMs: 60 * 1000, // 1 минута
      maxRequests: 30
    },
    // Логин попытки
    login: {
      windowMs: 15 * 60 * 1000, // 15 минут
      maxRequests: 5
    },
    // Регистрация
    registration: {
      windowMs: 60 * 60 * 1000, // 1 час
      maxRequests: 3
    },
    // Загрузка файлов
    upload: {
      windowMs: 5 * 60 * 1000, // 5 минут
      maxRequests: 10
    },
    // Сброс пароля
    resetPassword: {
      windowMs: 60 * 60 * 1000, // 1 час
      maxRequests: 3
    }
  };

  constructor(private readonly redisService: RedisService) {}

  /**
   * Проверяет rate limit для пользователя/IP
   */
  async checkRateLimit(
    identifier: string,
    action: keyof typeof this.presets | RateLimitConfig,
    customKey?: string
  ): Promise<RateLimitResult> {
    try {
      const config = typeof action === 'string' ? this.presets[action] : action;
      if (!config) {
        throw new Error(`Unknown rate limit action: ${action}`);
      }

      const key = customKey || this.generateKey(identifier, typeof action === 'string' ? action : 'custom');
      const windowSeconds = Math.floor(config.windowMs / 1000);

      const result = await this.redisService.checkRateLimit(
        key,
        config.maxRequests,
        windowSeconds
      );

      this.logger.debug(
        `Rate limit check for ${identifier}:${typeof action === 'string' ? action : 'custom'} - ` +
        `${result.allowed ? 'ALLOWED' : 'BLOCKED'} (${config.maxRequests - result.remaining}/${config.maxRequests})`
      );

      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
        totalHits: config.maxRequests - result.remaining
      };
    } catch (error) {
      this.logger.error('Error checking rate limit:', error.message);
      // В случае ошибки разрешаем запрос
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000,
        totalHits: 0
      };
    }
  }

  /**
   * Проверяет rate limit для отправки сообщений
   */
  async checkMessageRateLimit(userId: string, conversationId?: string): Promise<RateLimitResult> {
    const globalKey = `msg:${userId}`;
    const conversationKey = conversationId ? `msg:${userId}:${conversationId}` : null;

    // Проверяем глобальный лимит на сообщения
    const globalResult = await this.checkRateLimit(userId, 'messages', globalKey);
    if (!globalResult.allowed) {
      return globalResult;
    }

    // Если указан конкретный чат, проверяем лимит для этого чата
    if (conversationKey) {
      const conversationConfig: RateLimitConfig = {
        windowMs: 30 * 1000, // 30 секунд
        maxRequests: 10 // 10 сообщений в 30 секунд в одном чате
      };

      return await this.checkRateLimit(userId, conversationConfig, conversationKey);
    }

    return globalResult;
  }

  /**
   * Проверяет rate limit для API запросов
   */
  async checkApiRateLimit(identifier: string, endpoint?: string): Promise<RateLimitResult> {
    const key = endpoint ? `api:${identifier}:${endpoint}` : `api:${identifier}`;
    return await this.checkRateLimit(identifier, 'api', key);
  }

  /**
   * Проверяет rate limit для авторизации
   */
  async checkAuthRateLimit(identifier: string, action: 'login' | 'registration' | 'resetPassword'): Promise<RateLimitResult> {
    const key = `auth:${action}:${identifier}`;
    return await this.checkRateLimit(identifier, action, key);
  }

  /**
   * Проверяет rate limit для загрузки файлов
   */
  async checkUploadRateLimit(userId: string): Promise<RateLimitResult> {
    const key = `upload:${userId}`;
    return await this.checkRateLimit(userId, 'upload', key);
  }

  /**
   * Добавляет пользователя в временный бан
   */
  async banUser(userId: string, durationMs: number, reason?: string): Promise<void> {
    try {
      const banKey = `ban:${userId}`;
      const banData = {
        userId,
        bannedAt: Date.now(),
        expiresAt: Date.now() + durationMs,
        reason: reason || 'Rate limit exceeded',
        duration: durationMs
      };

      const durationSeconds = Math.floor(durationMs / 1000);
      await this.redisService.getClient()?.setEx(banKey, durationSeconds, JSON.stringify(banData));

      this.logger.warn(`User ${userId} banned for ${durationMs}ms. Reason: ${reason}`);
    } catch (error) {
      this.logger.error('Error banning user:', error.message);
    }
  }

  /**
   * Проверяет, забанен ли пользователь
   */
  async isUserBanned(userId: string): Promise<{ banned: boolean; banInfo?: any }> {
    try {
      const banKey = `ban:${userId}`;
      const banData = await this.redisService.getClient()?.get(banKey);

      if (banData) {
        const parsed = JSON.parse(banData);
        return {
          banned: true,
          banInfo: parsed
        };
      }

      return { banned: false };
    } catch (error) {
      this.logger.error('Error checking user ban:', error.message);
      return { banned: false };
    }
  }

  /**
   * Снимает бан с пользователя
   */
  async unbanUser(userId: string): Promise<void> {
    try {
      const banKey = `ban:${userId}`;
      await this.redisService.getClient()?.del(banKey);
      this.logger.log(`User ${userId} unbanned`);
    } catch (error) {
      this.logger.error('Error unbanning user:', error.message);
    }
  }

  /**
   * Получает статистику rate limiting для пользователя
   */
  async getUserRateLimitStats(userId: string): Promise<{
    api: RateLimitResult;
    messages: RateLimitResult;
    upload: RateLimitResult;
    isBanned: boolean;
    banInfo?: any;
  }> {
    try {
      const [apiStats, messageStats, uploadStats, banStatus] = await Promise.all([
        this.checkRateLimit(userId, 'api', `api:${userId}`),
        this.checkRateLimit(userId, 'messages', `msg:${userId}`),
        this.checkRateLimit(userId, 'upload', `upload:${userId}`),
        this.isUserBanned(userId)
      ]);

      return {
        api: apiStats,
        messages: messageStats,
        upload: uploadStats,
        isBanned: banStatus.banned,
        banInfo: banStatus.banInfo
      };
    } catch (error) {
      this.logger.error('Error getting user rate limit stats:', error.message);
      // Возвращаем безопасные значения
      const safeResult: RateLimitResult = {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000,
        totalHits: 0
      };

      return {
        api: safeResult,
        messages: safeResult,
        upload: safeResult,
        isBanned: false
      };
    }
  }

  /**
   * Очищает все rate limit данные для пользователя
   */
  async clearUserRateLimits(userId: string): Promise<void> {
    try {
      const client = this.redisService.getClient();
      if (!client) return;

      const patterns = [
        `api:${userId}*`,
        `msg:${userId}*`,
        `upload:${userId}*`,
        `auth:*:${userId}*`
      ];

      for (const pattern of patterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      }

      this.logger.log(`Rate limit data cleared for user ${userId}`);
    } catch (error) {
      this.logger.error('Error clearing user rate limits:', error.message);
    }
  }

  /**
   * Получает информацию о заблокированных пользователях
   */
  async getBannedUsers(): Promise<any[]> {
    try {
      const client = this.redisService.getClient();
      if (!client) return [];

      const banKeys = await client.keys('ban:*');
      const bannedUsers = [];

      for (const key of banKeys) {
        const banData = await client.get(key);
        if (banData) {
          bannedUsers.push(JSON.parse(banData));
        }
      }

      return bannedUsers;
    } catch (error) {
      this.logger.error('Error getting banned users:', error.message);
      return [];
    }
  }

  /**
   * Автоматически банит пользователя при превышении лимитов
   */
  async checkAndBanForAbuse(userId: string, action: string): Promise<boolean> {
    try {
      // Проверяем количество нарушений в последний час
      const violationKey = `violations:${userId}`;
      const client = this.redisService.getClient();
      if (!client) return false;

      const violations = await client.incr(violationKey);
      
      // Устанавливаем TTL если это первое нарушение
      if (violations === 1) {
        await client.expire(violationKey, 3600); // 1 час
      }

      // Эскалация банов
      if (violations >= 10) {
        // 24 часа за 10+ нарушений
        await this.banUser(userId, 24 * 60 * 60 * 1000, `Automatic ban: ${violations} violations in 1 hour`);
        return true;
      } else if (violations >= 5) {
        // 1 час за 5+ нарушений
        await this.banUser(userId, 60 * 60 * 1000, `Automatic ban: ${violations} violations in 1 hour`);
        return true;
      } else if (violations >= 3) {
        // 15 минут за 3+ нарушения
        await this.banUser(userId, 15 * 60 * 1000, `Automatic ban: ${violations} violations in 1 hour`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking abuse patterns:', error.message);
      return false;
    }
  }

  /**
   * Генерирует ключ для rate limiting
   */
  private generateKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  /**
   * Получает конфигурацию для действия
   */
  getPresetConfig(action: keyof typeof this.presets): RateLimitConfig | null {
    return this.presets[action] || null;
  }

  /**
   * Обновляет конфигурацию preset
   */
  updatePresetConfig(action: keyof typeof this.presets, config: Partial<RateLimitConfig>): void {
    if (this.presets[action]) {
      Object.assign(this.presets[action], config);
      this.logger.log(`Rate limit preset '${action}' updated`);
    }
  }
}