import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/modules/auth/models/user.model';
import { Group } from './group.model';
import { Chat } from './chat.model';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Message {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sender: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  chat?: Chat;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Group' })
  group?: Group;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = HydratedDocument<Message>;
