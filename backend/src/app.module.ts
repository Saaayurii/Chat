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
import { redisConfig } from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
      useFactory: redisConfig,
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');

        if (!uri) {
          console.error('❌ MONGO_URI не найден в переменных окружения!');
          console.log(
            'Доступные переменные:',
            Object.keys(process.env).slice(0, 10),
          );
          throw new Error('MONGO_URI is required');
        }

        console.log('✅ MONGO_URI найден, подключаемся...');

        return {
          uri,
          serverSelectionTimeoutMS: 5000, // 5 секунд на подключение
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          retryWrites: true,
          w: 'majority',
        };
      },
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
})
export class AppModule {}
