import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { User, UserSchema } from '../schemas/user.schema';
import { Question, QuestionSchema } from '../schemas/question.schema';
import { Complaint, ComplaintSchema } from '../schemas/complaint.schema';
import { BlacklistEntry, BlacklistEntrySchema } from '../schemas/blacklist-entry.schema';
import { OperatorRating, OperatorRatingSchema } from '../schemas/operator-rating.schema';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { Message, MessageSchema } from '../schemas/message.schema';

// Seeders
import { MainSeeder } from './main.seeder';
import { UsersSeeder } from './users.seeder';
import { QuestionsSeeder } from './questions.seeder';
import { ComplaintsSeeder } from './complaints.seeder';
import { BlacklistSeeder } from './blacklist.seeder';
import { RatingsSeeder } from './ratings.seeder';
import { ConversationsSeeder } from './conversations.seeder';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Complaint.name, schema: ComplaintSchema },
      { name: BlacklistEntry.name, schema: BlacklistEntrySchema },
      { name: OperatorRating.name, schema: OperatorRatingSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [
    MainSeeder,
    UsersSeeder,
    QuestionsSeeder,
    ComplaintsSeeder,
    BlacklistSeeder,
    RatingsSeeder,
    ConversationsSeeder,
  ],
  exports: [MainSeeder],
})
export class SeedersModule {}