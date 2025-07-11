import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { FileUploadService } from './services/file-upload.service';
import { PresenceService } from './services/presence.service';
import { MessageCacheService } from './services/message-cache.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  providers: [RedisService, FileUploadService, PresenceService, MessageCacheService, RateLimitGuard],
  exports: [RedisService, FileUploadService, PresenceService, MessageCacheService, RateLimitGuard],
})
export class CommonModule {}