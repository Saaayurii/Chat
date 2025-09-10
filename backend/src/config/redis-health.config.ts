import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import Redis from 'ioredis';

export const createRedisConfig = async (configService: ConfigService): Promise<CacheModuleOptions> => {
  const redisUrl = configService.get<string>('REDIS_URL');
  
  console.log('🔍 Проверяем подключение к Redis...');
  
  if (redisUrl) {
    try {
      // Создаем тестовое подключение для проверки
      const testClient = new Redis(redisUrl, {
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });

      // Пробуем подключиться
      await testClient.connect();
      await testClient.ping();
      await testClient.quit();
      
      console.log('✅ Redis подключение успешно');
      
      return {
        store: redisStore,
        url: redisUrl,
        ttl: configService.get<number>('CACHE_TTL', 3600),
        max: configService.get<number>('CACHE_MAX', 100),
        isGlobal: true,
        // Настройки для предотвращения зависания
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        // Обработчики событий для логирования
        onClientCreated: (client: any) => {
          client.on('error', (err: any) => {
            console.error('❌ Redis ошибка:', err.message);
          });
          client.on('connect', () => {
            console.log('✅ Redis подключен');
          });
          client.on('ready', () => {
            console.log('✅ Redis готов');
          });
          client.on('close', () => {
            console.warn('⚠️ Redis подключение закрыто');
          });
          client.on('reconnecting', () => {
            console.log('🔄 Redis переподключение...');
          });
        },
      };
    } catch (error) {
      console.warn('⚠️ Redis недоступен, используем память для кеширования:', error.message);
      
      // Fallback на память
      return {
        ttl: configService.get<number>('CACHE_TTL', 3600),
        max: configService.get<number>('CACHE_MAX', 100),
        isGlobal: true,
      };
    }
  }
  
  console.log('ℹ️ Redis URL не настроен, используем память для кеширования');
  
  // Возвращаем конфигурацию с памятью
  return {
    ttl: configService.get<number>('CACHE_TTL', 3600),
    max: configService.get<number>('CACHE_MAX', 100),
    isGlobal: true,
  };
};