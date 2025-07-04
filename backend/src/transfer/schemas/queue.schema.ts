import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AssignmentStatus } from '../enums/assignment-status.enum';

@Schema({ timestamps: true })
export class Queue extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  visitorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date, default: Date.now })
  queuedAt: Date;

  @Prop({ type: Date })
  assignedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedOperatorId: Types.ObjectId;

  @Prop({ enum: AssignmentStatus, default: AssignmentStatus.QUEUED })
  status: AssignmentStatus;

  @Prop({ type: Number })
  estimatedWaitTime: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const QueueSchema = SchemaFactory.createForClass(Queue);