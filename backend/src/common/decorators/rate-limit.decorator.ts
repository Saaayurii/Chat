import { SetMetadata } from '@nestjs/common';

export const RateLimit = (limit: number, windowInSeconds: number = 60) => 
  SetMetadata('rateLimit', limit) && SetMetadata('rateLimitWindow', windowInSeconds);