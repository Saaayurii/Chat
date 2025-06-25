import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './modules/auth/auth.module';
import { ChatMoodule } from './modules/chat/chat.module';

import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { QuestionsModule } from './questions/questions.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { RatingsModule } from './ratings/ratings.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ChatMoodule,
    UsersModule,
    ChatModule,
    QuestionsModule,
    ComplaintsModule,
    RatingsModule,
    BlacklistModule,
    EmailModule,
    DatabaseModule,
  ],
})
export class AppModule {}
