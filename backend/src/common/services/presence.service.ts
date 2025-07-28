import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { 
  PresenceData, 
  PresenceStatus, 
  DeviceType, 
  DeviceTypeString,
  OnlineUser, 
  PresenceHistory,
  PresenceConfig,
  DEFAULT_PRESENCE_CONFIG
} from '../interfaces/presence.interface';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly config: PresenceConfig = DEFAULT_PRESENCE_CONFIG;
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Обновляет присутствие пользователя
   */
  async updateUserPresence(
    userId: string, 
    status: PresenceStatus, 
    options: {
      deviceId?: string;
      deviceType?: DeviceTypeString;
      activity?: string;
      location?: string;
    } = {}
  ): Promise<PresenceData> {
    const presenceData: PresenceData = {
      status,
      lastSeen: Date.now(),
      deviceId: options.deviceId,
      deviceType: options.deviceType || 'unknown',
      activity: options.activity,
      location: options.location
    };

    // Определяем TTL в зависимости от статуса
    let ttl = this.config.offlineTimeout / 1000; // Для offline статуса
    if (status === PresenceStatus.ONLINE) {
      ttl = this.config.heartbeatInterval / 1000 * 2; // Удвоенный интервал heartbeat
    }

    await this.redisService.setUserPresence(userId, presenceData, ttl);
    
    this.logger.debug(`User ${userId} presence updated to ${status}`);
    return presenceData;
  }

  /**
   * Получает присутствие пользователя
   */
  async getUserPresence(userId: string): Promise<PresenceData | null> {
    return await this.redisService.getUserPresence(userId);
  }

  /**
   * Получает присутствие нескольких пользователей
   */
  async getMultipleUserPresence(userIds: string[]): Promise<{ [userId: string]: PresenceData }> {
    return await this.redisService.getMultipleUserPresence(userIds);
  }

  /**
   * Получает список онлайн пользователей
   */
  async getOnlineUsers(limit: number = 100): Promise<OnlineUser[]> {
    return await this.redisService.getOnlineUsers(limit);
  }

  /**
   * Получает историю присутствия пользователя
   */
  async getUserPresenceHistory(userId: string, limit: number = 10): Promise<PresenceHistory[]> {
    return await this.redisService.getUserPresenceHistory(userId, limit);
  }

  /**
   * Запускает heartbeat для пользователя
   */
  startHeartbeat(userId: string, onDisconnect?: () => void): void {
    // Очищаем существующий таймер если есть
    this.stopHeartbeat(userId);

    const timer = setInterval(async () => {
      try {
        const currentPresence = await this.getUserPresence(userId);
        
        if (currentPresence && currentPresence.status === PresenceStatus.ONLINE) {
          // Обновляем lastSeen
          await this.updateUserPresence(userId, PresenceStatus.ONLINE, {
            deviceType: currentPresence.deviceType,
            activity: currentPresence.activity,
            location: currentPresence.location
          });
        } else {
          // Пользователь больше не онлайн, останавливаем heartbeat
          this.stopHeartbeat(userId);
          onDisconnect?.();
        }
      } catch (error) {
        this.logger.error(`Heartbeat error for user ${userId}:`, error);
        this.stopHeartbeat(userId);
        onDisconnect?.();
      }
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(userId, timer);
    this.logger.debug(`Heartbeat started for user ${userId}`);
  }

  /**
   * Останавливает heartbeat для пользователя
   */
  stopHeartbeat(userId: string): void {
    const timer = this.heartbeatTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(userId);
      this.logger.debug(`Heartbeat stopped for user ${userId}`);
    }
  }

  /**
   * Устанавливает пользователя как онлайн и запускает heartbeat
   */
  async setUserOnline(
    userId: string, 
    options: {
      deviceId?: string;
      deviceType?: DeviceTypeString;
      activity?: string;
      location?: string;
    } = {}
  ): Promise<PresenceData> {
    const presence = await this.updateUserPresence(userId, PresenceStatus.ONLINE, options);
    
    // Запускаем heartbeat
    this.startHeartbeat(userId, () => {
      this.setUserOffline(userId);
    });

    return presence;
  }

  /**
   * Устанавливает пользователя как оффлайн
   */
  async setUserOffline(userId: string): Promise<void> {
    this.stopHeartbeat(userId);
    await this.redisService.setUserOffline(userId);
    this.logger.debug(`User ${userId} set offline`);
  }

  /**
   * Устанавливает статус "away" через определенное время неактивности
   */
  async setUserAway(userId: string): Promise<PresenceData | null> {
    const currentPresence = await this.getUserPresence(userId);
    
    if (currentPresence && currentPresence.status === PresenceStatus.ONLINE) {
      return await this.updateUserPresence(userId, PresenceStatus.AWAY, {
        deviceType: currentPresence.deviceType,
        activity: currentPresence.activity,
        location: currentPresence.location
      });
    }
    
    return null;
  }

  /**
   * Проверяет, онлайн ли пользователь
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const presence = await this.getUserPresence(userId);
    return presence?.status === PresenceStatus.ONLINE;
  }

  /**
   * Получает статистику присутствия
   */
  async getPresenceStats(): Promise<{
    online: number;
    away: number;
    busy: number;
    offline: number;
    total: number;
  }> {
    try {
      const onlineUsers = await this.getOnlineUsers(1000); // Получаем больше пользователей для статистики
      
      const stats = {
        online: 0,
        away: 0,
        busy: 0,
        offline: 0,
        total: onlineUsers.length
      };

      onlineUsers.forEach(user => {
        switch (user.status) {
          case PresenceStatus.ONLINE:
            stats.online++;
            break;
          case PresenceStatus.AWAY:
            stats.away++;
            break;
          case PresenceStatus.BUSY:
            stats.busy++;
            break;
          default:
            stats.offline++;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('Error getting presence stats:', error);
      return { online: 0, away: 0, busy: 0, offline: 0, total: 0 };
    }
  }

  /**
   * Очищает устаревшие данные присутствия
   */
  async cleanupExpiredPresence(): Promise<number> {
    try {
      const onlineUsers = await this.getOnlineUsers(1000);
      const now = Date.now();
      let cleanupCount = 0;

      for (const user of onlineUsers) {
        const timeSinceLastSeen = now - user.lastSeen;
        
        // Если пользователь неактивен более timeout, помечаем как offline
        if (timeSinceLastSeen > this.config.offlineTimeout) {
          await this.setUserOffline(user.userId);
          cleanupCount++;
        }
        // Если неактивен более away timeout, но меньше offline timeout, помечаем как away
        else if (timeSinceLastSeen > this.config.awayTimeout && user.status === PresenceStatus.ONLINE) {
          await this.setUserAway(user.userId);
        }
      }

      this.logger.debug(`Cleaned up ${cleanupCount} expired presence records`);
      return cleanupCount;
    } catch (error) {
      this.logger.error('Error cleaning up expired presence:', error);
      return 0;
    }
  }

  /**
   * Завершает работу сервиса
   */
  async onModuleDestroy(): Promise<void> {
    // Останавливаем все heartbeat таймеры
    for (const [userId, timer] of this.heartbeatTimers) {
      clearInterval(timer);
      this.logger.debug(`Stopped heartbeat for user ${userId} on module destroy`);
    }
    this.heartbeatTimers.clear();
  }
}