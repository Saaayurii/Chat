import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationType {
  USER_OPERATOR = 'user-operator',
  OPERATOR_OPERATOR = 'operator-operator',
  OPERATOR_ADMIN = 'operator-admin',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred',
}

@Schema({ 
  timestamps: true,
  collection: 'conversations'
})
export class Conversation {
  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'User' }],
    required: true,
    validate: {
      validator: (participants: Types.ObjectId[]) => participants.length >= 1,
      message: 'Conversation must have at least 1 participant'
    }
  })
  participants: Types.ObjectId[];

  @Prop({ 
    type: String, 
    enum: ConversationType, 
    required: true 
  })
  type: ConversationType;

  @Prop({ 
    type: String, 
    enum: ConversationStatus, 
    default: ConversationStatus.ACTIVE 
  })
  status: ConversationStatus;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  relatedQuestionId?: Types.ObjectId;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false })
  waitingForAssignment?: boolean;

  @Prop({
    type: {
      text: { type: String, required: true },
      senderId: { type: Types.ObjectId, ref: 'User', required: true },
      timestamp: { type: Date, required: true },
      messageId: { type: Types.ObjectId, required: true }
    },
    _id: false
  })
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    timestamp: Date;
    messageId: Types.ObjectId;
  };

  @Prop({ default: 0 })
  unreadMessagesCount: number;

  @Prop({ type: Map, of: Number, default: {} })
  unreadByParticipant: Map<string, number>; // participantId -> unread count

  @Prop({ type: Types.ObjectId, ref: 'User' })
  transferredFrom?: Types.ObjectId; // Кто передал беседу

  @Prop({ type: Types.ObjectId, ref: 'User' })
  transferredTo?: Types.ObjectId; // Кому передал

  @Prop()
  transferReason?: string;

  @Prop()
  closedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Индексы
ConversationSchema.index({ participants: 1, status: 1 });
ConversationSchema.index({ type: 1, status: 1 });
ConversationSchema.index({ relatedQuestionId: 1 });
ConversationSchema.index({ 'lastMessage.timestamp': -1 });
ConversationSchema.index({ updatedAt: -1 });
