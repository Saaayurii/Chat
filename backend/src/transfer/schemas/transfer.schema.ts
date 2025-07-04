import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransferStatus } from '../enums/transfer-status.enum';

@Schema({ timestamps: true })
export class Transfer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromOperatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toOperatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  visitorId: Types.ObjectId;

  @Prop({ enum: TransferStatus, default: TransferStatus.PENDING })
  status: TransferStatus;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date;

  @Prop({ type: Date })
  respondedAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);