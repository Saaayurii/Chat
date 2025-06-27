import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// import { UsersModule } from './modules/auth/models/user.model';
// import { ChatModule } from './chat/chat.module';
// import { QuestionsModule } from './questions/questions.module';
// import { ComplaintsModule } from './complaints/complaints.module';
// import { RatingsModule } from './ratings/ratings.module';
// import { BlacklistModule } from './blacklist/blacklist.module';
// import { EmailModule } from './email/email.module';
// import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Direct connection approach
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
    // ChatModule,
    UsersModule,
    // QuestionsModule,
    // ComplaintsModule,
    // RatingsModule,
    // BlacklistModule,
    // EmailModule,
    // DatabaseModule,
  ],
})
export class AppModule {}
