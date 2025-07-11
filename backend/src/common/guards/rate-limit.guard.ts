import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../services/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const limit = this.reflector.get<number>('rateLimit', context.getHandler()) || 10;
    const window = this.reflector.get<number>('rateLimitWindow', context.getHandler()) || 60;
    
    // Используем IP + User ID для более точного лимитирования
    const userId = request.user?.id || 'anonymous';
    const ip = request.ip || request.connection.remoteAddress;
    const key = `rate_limit:${ip}:${userId}`;
    
    const { allowed, remaining } = await this.redisService.checkRateLimit(key, limit, window);
    
    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          remaining: 0,
          resetTime: window,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Добавляем информацию о лимитах в headers
    request.rateLimitInfo = {
      limit,
      remaining,
      resetTime: window,
    };
    
    return true;
  }
}