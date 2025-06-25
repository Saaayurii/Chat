import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/modules/auth/model/user.model';
import { Message } from './message.model';

@Schema()
export class Group extends Document {
  @Prop({ required: true })
  name: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  members: User[];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }])
  messages: Message[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
