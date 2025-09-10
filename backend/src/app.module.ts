import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { QuestionsModule } from './questions/questions.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { RatingsModule } from './ratings/ratings.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { EmailModule } from './email/email.module';
import { TransferModule } from './transfer/transfer.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { createRedisConfig } from './config/redis-health.config';
import { databaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StaticFilesService } from './common/services/static-files.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 минута
        limit: 10, // 10 запросов
      },
    ]),
    ScheduleModule.forRoot(),
    TerminusModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: createRedisConfig,
      inject: [ConfigService],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    ChatModule,
    UsersModule,
    QuestionsModule,
    ComplaintsModule,
    RatingsModule,
    BlacklistModule,
    EmailModule,
    TransferModule,
    CommonModule,
    HealthModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, StaticFilesService],
})
export class AppModule {}
