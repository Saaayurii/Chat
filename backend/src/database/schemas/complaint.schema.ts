import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ComplaintDocument = Complaint & Document;

export enum ComplaintStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ComplaintType {
  POOR_SERVICE = 'poor_service',
  RUDE_BEHAVIOR = 'rude_behavior',
  SLOW_RESPONSE = 'slow_response',
  INCORRECT_INFO = 'incorrect_info',
  OTHER = 'other',
}

export enum ComplaintSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Schema({ 
  timestamps: true,
  collection: 'complaints'
})
export class Complaint {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  visitorId: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  operatorId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ComplaintType, 
    required: true 
  })
  type: ComplaintType;

  @Prop({ 
    required: true,
    maxlength: 1000,
    trim: true
  })
  complaintText: string;

  @Prop({ 
    type: String, 
    enum: ComplaintStatus, 
    default: ComplaintStatus.PENDING 
  })
  status: ComplaintStatus;

  @Prop({ 
    type: String, 
    enum: ComplaintSeverity, 
    default: ComplaintSeverity.MEDIUM 
  })
  severity: ComplaintSeverity;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  relatedQuestionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  relatedConversationId?: Types.ObjectId;

  // Обработка жалобы
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId; // Кто рассматривал (обычно админ)

  @Prop()
  reviewedAt?: Date;

  @Prop({ maxlength: 1000 })
  adminResponse?: string;

  @Prop({ maxlength: 500 })
  resolutionNotes?: string; // Внутренние заметки о решении

  // Доказательства
  @Prop([{
    type: { type: String, required: true }, // 'screenshot', 'chat_log', 'other'
    url: { type: String, required: true },
    description: { type: String }
  }])
  evidence?: {
    type: string;
    url: string;
    description?: string;
  }[];

  @Prop()
  resolvedAt?: Date;

  // Последующие действия
  @Prop({ default: false })
  operatorWarned: boolean;

  @Prop({ default: false })
  operatorSuspended: boolean;

  @Prop()
  suspensionDuration?: number; // в днях

  @Prop({ default: false })
  followUpRequired: boolean;

  @Prop()
  followUpDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);

// Индексы
ComplaintSchema.index({ visitorId: 1, status: 1 });
ComplaintSchema.index({ operatorId: 1, status: 1 });
ComplaintSchema.index({ status: 1, severity: 1, createdAt: -1 });
ComplaintSchema.index({ type: 1, status: 1 });
ComplaintSchema.index({ reviewedBy: 1, reviewedAt: -1 });
ComplaintSchema.index({ createdAt: -1 });