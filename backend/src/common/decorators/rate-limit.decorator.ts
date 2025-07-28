import { SetMetadata } from '@nestjs/common';
import { RateLimitOptions } from '../guards/rate-limit.guard';

export const RateLimit = (options: RateLimitOptions | number, windowInSeconds?: number) => {
  if (typeof options === 'number') {
    // Обратная совместимость
    return SetMetadata('rateLimitOptions', { 
      limit: options, 
      window: windowInSeconds || 60, 
      action: 'api' 
    });
  }
  return SetMetadata('rateLimitOptions', options);
};

// Специализированные декораторы для удобства
export const ApiRateLimit = (limit: number = 100, window: number = 900) => 
  SetMetadata('rateLimitOptions', { action: 'api', limit, window });

export const MessageRateLimit = (limit: number = 30, window: number = 60) => 
  SetMetadata('rateLimitOptions', { action: 'messages', limit, window, banOnExceed: true });

export const AuthRateLimit = (action: 'login' | 'registration' | 'resetPassword', limit: number = 5) => 
  SetMetadata('rateLimitOptions', { action, limit, banOnExceed: true });

export const UploadRateLimit = (limit: number = 10, window: number = 300) => 
  SetMetadata('rateLimitOptions', { action: 'upload', limit, window });

// Для обратной совместимости
export const RateLimitWindow = (window: number) => SetMetadata('rateLimitWindow', window);