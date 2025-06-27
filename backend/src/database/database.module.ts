import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User, UserSchema } from './schemas/user.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Question, QuestionSchema } from './schemas/question.schema';
import { Complaint, ComplaintSchema } from './schemas/complaint.schema';
import { OperatorRating, OperatorRatingSchema } from './schemas/operator-rating.schema';
import { BlacklistEntry, BlacklistEntrySchema } from './schemas/blacklist-entry.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // Настройки для продакшена
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      }),
      inject: [ConfigService],
    }),
    
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Complaint.name, schema: ComplaintSchema },
      { name: OperatorRating.name, schema: OperatorRatingSchema },
      { name: BlacklistEntry.name, schema: BlacklistEntrySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}