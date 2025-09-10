import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export const redisConfig = async (configService: ConfigService): Promise<CacheModuleOptions> => {
  const redisUrl = configService.get<string>('REDIS_URL');
  
  // Тестируем подключение к Redis перед настройкой
  if (redisUrl) {
    try {
      // Пробуем подключиться к Redis
      const testConfig = {
        store: redisStore,
        url: redisUrl,
        ttl: configService.get<number>('CACHE_TTL', 3600),
        max: configService.get<number>('CACHE_MAX', 100),
        isGlobal: true,
        // Настройки таймаутов для предотвращения зависания
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        },
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };
      
      console.log('🔍 Проверяем подключение к Redis...');
      return testConfig;
    } catch (error) {
      console.warn('⚠️ Ошибка подключения к Redis, используем память:', error.message);
      // Fallback на память при ошибке подключения к Redis
      return {
        ttl: configService.get<number>('CACHE_TTL', 3600),
        max: configService.get<number>('CACHE_MAX', 100),
        isGlobal: true,
      };
    }
  }
  
  // Fallback для локального Redis с проверкой подключения
  try {
    const localConfig = {
      store: redisStore,
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB', 0),
      ttl: configService.get<number>('CACHE_TTL', 3600),
      max: configService.get<number>('CACHE_MAX', 100),
      isGlobal: true,
      // Настройки таймаутов
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };
    
    console.log('🔍 Проверяем подключение к локальному Redis...');
    return localConfig;
  } catch (error) {
    console.warn('⚠️ Ошибка подключения к локальному Redis, используем память:', error.message);
    // Окончательный fallback на память
    return {
      ttl: configService.get<number>('CACHE_TTL', 3600),
      max: configService.get<number>('CACHE_MAX', 100),
      isGlobal: true,
    };
  }
};