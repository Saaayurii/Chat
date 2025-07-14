import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../services/rate-limit.service';

export interface RateLimitOptions {
  action?: string;
  limit?: number;
  window?: number;
  skipAuth?: boolean;
  customKey?: string;
  banOnExceed?: boolean;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private rateLimitService: RateLimitService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Получаем конфигурацию rate limit из декоратора
    const options = this.reflector.get<RateLimitOptions>('rateLimitOptions', context.getHandler()) || {};
    
    // Определяем идентификатор пользователя
    const userId = request.user?.id;
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const identifier = userId || ip;

    // Проверяем, не забанен ли пользователь
    if (userId) {
      const banStatus = await this.rateLimitService.isUserBanned(userId);
      if (banStatus.banned) {
        this.logger.warn(`Banned user ${userId} attempted to access ${request.url}`);
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Access temporarily restricted',
            banInfo: banStatus.banInfo,
            error: 'User Banned'
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    try {
      let result;

      // Выбираем тип проверки на основе конфигурации
      if (options.action) {
        switch (options.action) {
          case 'api':
            result = await this.rateLimitService.checkApiRateLimit(identifier, request.route?.path);
            break;
          case 'messages':
            result = await this.rateLimitService.checkMessageRateLimit(identifier);
            break;
          case 'upload':
            result = await this.rateLimitService.checkUploadRateLimit(identifier);
            break;
          case 'login':
          case 'registration':
          case 'resetPassword':
            result = await this.rateLimitService.checkAuthRateLimit(identifier, options.action);
            break;
          default:
            result = await this.rateLimitService.checkRateLimit(identifier, 'api');
        }
      } else if (options.limit && options.window) {
        // Кастомная конфигурация
        const customConfig = {
          windowMs: options.window * 1000,
          maxRequests: options.limit
        };
        result = await this.rateLimitService.checkRateLimit(
          identifier, 
          customConfig, 
          options.customKey
        );
      } else {
        // Используем конфигурацию по умолчанию для API
        result = await this.rateLimitService.checkApiRateLimit(identifier);
      }

      // Добавляем заголовки с информацией о rate limit
      response.set({
        'X-RateLimit-Limit': result.totalHits + result.remaining,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-RateLimit-Total-Hits': result.totalHits
      });

      if (!result.allowed) {
        // Логируем превышение лимита
        this.logger.warn(
          `Rate limit exceeded for ${identifier} on ${request.method} ${request.url}. ` +
          `Hits: ${result.totalHits}, Limit: ${result.totalHits + result.remaining}`
        );

        // Проверяем автоматический бан при критических нарушениях
        if (options.banOnExceed && userId) {
          const banned = await this.rateLimitService.checkAndBanForAbuse(userId, options.action || 'api');
          if (banned) {
            this.logger.warn(`User ${userId} automatically banned for rate limit abuse`);
          }
        }

        // Добавляем Retry-After заголовок
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        response.set('Retry-After', retryAfter.toString());

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded. Please try again later.',
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter,
            error: 'Too Many Requests'
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Сохраняем информацию о rate limit в request для дальнейшего использования
      request.rateLimitInfo = result;

      return true;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Rate limit check failed:', error.message);
      
      // В случае ошибки разрешаем запрос, но логируем проблему
      return true;
    }
  }
}