import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/modules/auth/model/user.model';
import mongoose from 'mongoose';
import { Message } from './message.model';

@Schema()
export class Chat extends Document {
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  participants: [User];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }])
  messages: [Message];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
