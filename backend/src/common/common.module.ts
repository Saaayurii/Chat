import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { FileUploadService } from './services/file-upload.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  providers: [RedisService, FileUploadService, RateLimitGuard],
  exports: [RedisService, FileUploadService, RateLimitGuard],
})
export class CommonModule {}