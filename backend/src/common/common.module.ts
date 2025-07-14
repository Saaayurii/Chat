import { Module } from '@nestjs/common';
import { RedisModule } from './services/redis.module';
import { RedisService } from './services/redis.service';
import { RedisCompatService } from './services/redis-compat.service';
import { FileUploadService } from './services/file-upload.service';
import { PresenceService } from './services/presence.service';
import { MessageCacheService } from './services/message-cache.service';
import { RateLimitService } from './services/rate-limit.service';
import { NotificationService } from './services/notification.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [RedisModule],
  providers: [
    RedisService,
    RedisCompatService,
    FileUploadService, 
    PresenceService, 
    MessageCacheService, 
    RateLimitService, 
    NotificationService,
    RateLimitGuard
  ],
  exports: [
    RedisModule,
    RedisService,
    RedisCompatService,
    FileUploadService, 
    PresenceService, 
    MessageCacheService, 
    RateLimitService, 
    NotificationService,
    RateLimitGuard
  ],
})
export class CommonModule {}