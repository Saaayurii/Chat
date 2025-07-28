import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TerminusModule, MongooseModule, CommonModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}