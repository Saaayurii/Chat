import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { User, UserSchema } from '../database/schemas/user.schema';
import { Question, QuestionSchema } from '../database/schemas/question.schema';
import { Complaint, ComplaintSchema } from '../database/schemas/complaint.schema';
import { BlacklistEntry, BlacklistEntrySchema } from '../database/schemas/blacklist-entry.schema';
import { OperatorRating, OperatorRatingSchema } from '../database/schemas/operator-rating.schema';
import { Conversation, ConversationSchema } from '../database/schemas/conversation.schema';
import { Message, MessageSchema } from '../database/schemas/message.schema';

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