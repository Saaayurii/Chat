import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export const redisConfig = (configService: ConfigService): CacheModuleOptions => {
  const redisUrl = configService.get<string>('REDIS_URL');
  
  if (redisUrl) {
    // Используем URL для подключения к облачному Redis
    return {
      store: redisStore,
      url: redisUrl,
      ttl: configService.get<number>('CACHE_TTL', 3600),
      max: configService.get<number>('CACHE_MAX', 100),
      isGlobal: true,
    };
  }
  
  // Fallback для локального Redis
  return {
    store: redisStore,
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_DB', 0),
    ttl: configService.get<number>('CACHE_TTL', 3600),
    max: configService.get<number>('CACHE_MAX', 100),
    isGlobal: true,
  };
};