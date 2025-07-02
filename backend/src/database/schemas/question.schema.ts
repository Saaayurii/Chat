import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

export enum QuestionStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  ANSWERED = 'answered',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred',
}

export enum QuestionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum QuestionCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  COMPLAINT = 'complaint',
  OTHER = 'other',
}

@Schema({ 
  timestamps: true,
  collection: 'questions'
})
export class Question {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  visitorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  operatorId?: Types.ObjectId;

  @Prop({ 
    required: true,
    maxlength: 1000,
    trim: true
  })
  text: string;

  @Prop({ 
    type: String, 
    enum: QuestionStatus, 
    default: QuestionStatus.OPEN 
  })
  status: QuestionStatus;

  @Prop({ 
    type: String, 
    enum: QuestionPriority, 
    default: QuestionPriority.NORMAL 
  })
  priority: QuestionPriority;

  @Prop({ 
    type: String, 
    enum: QuestionCategory, 
    default: QuestionCategory.GENERAL 
  })
  category: QuestionCategory;

  @Prop()
  assignedAt?: Date;

  @Prop()
  firstResponseAt?: Date; // Время первого ответа оператора

  @Prop()
  resolvedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  // Метрики для аналитики
  @Prop({ default: 0 })
  responseTimeMinutes: number; // Время до первого ответа

  @Prop({ default: 0 })
  resolutionTimeMinutes: number; // Время до решения

  @Prop({ default: 0 })
  messagesCount: number; // Количество сообщений в беседе

  // История передач
  @Prop([{
    fromOperatorId: { type: Types.ObjectId, ref: 'User' },
    toOperatorId: { type: Types.ObjectId, ref: 'User' },
    reason: { type: String },
    transferredAt: { type: Date, default: Date.now }
  }])
  transferHistory: {
    fromOperatorId: Types.ObjectId;
    toOperatorId: Types.ObjectId;
    reason: string;
    transferredAt: Date;
  }[];

  @Prop({ type: [String] })
  tags: string[]; // Теги для категоризации

  @Prop()
  internalNotes?: string; // Внутренние заметки операторов

  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Индексы
QuestionSchema.index({ visitorId: 1, status: 1 });
QuestionSchema.index({ operatorId: 1, status: 1 });
QuestionSchema.index({ status: 1, priority: 1, createdAt: 1 });
QuestionSchema.index({ category: 1, status: 1 });
QuestionSchema.index({ conversationId: 1 });
QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ tags: 1 });