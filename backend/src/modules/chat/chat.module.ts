import { Module } from '@nestjs/common';
import { GroupService } from './services/group.service';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './gateways/chat.gateways';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/models/user.model';
import { Group, GroupSchema } from '../auth/models/group.model';
import { Message, MessageSchema } from '../auth/models/message.model';
import { Chat, ChatSchema } from '../auth/models/chat.model';


@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  providers: [GroupService, ChatGateway],
})
export class ChatMoodule {}
