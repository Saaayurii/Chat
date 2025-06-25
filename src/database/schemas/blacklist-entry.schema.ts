import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlacklistEntryDocument = BlacklistEntry & Document;

export enum BlacklistReason {
  SPAM = 'spam',
  ABUSIVE_LANGUAGE = 'abusive_language',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  VIOLATION_OF_RULES = 'violation_of_rules',
  REPEATED_COMPLAINTS = 'repeated_complaints',
  OTHER = 'other',
}

export enum BlacklistType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

export enum BlacklistStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Schema({ 
  timestamps: true,
  collection: 'blacklist_entries'
})
export class BlacklistEntry {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  userId: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  blockedBy: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: BlacklistReason, 
    required: true 
  })
  reason: BlacklistReason;

  @Prop({ 
    required: true,
    maxlength: 500,
    trim: true
  })
  description: string;

  @Prop({ 
    type: String, 
    enum: BlacklistType, 
    default: BlacklistType.TEMPORARY 
  })
  type: BlacklistType;

  @Prop({ 
    type: String, 
    enum: BlacklistStatus, 
    default: BlacklistStatus.ACTIVE 
  })
  status: BlacklistStatus;

  @Prop({ default: false })
  approvedByAdmin: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop()
  expiresAt?: Date; // Для временных блокировок

  @Prop({ default: 1 })
  severity: number; // 1-5, влияет на длительность блокировки

  // Связанные инциденты
  @Prop({ type: [Types.ObjectId], ref: 'Complaint' })
  relatedComplaints: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Message' })
  relatedMessages: Types.ObjectId[];

  // Доказательства
  @Prop([{
    type: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String }
  }])
  evidence?: {
    type: string;
    url: string;
    description?: string;
  }[];

  // Отмена блокировки
  @Prop({ type: Types.ObjectId, ref: 'User' })
  revokedBy?: Types.ObjectId;

  @Prop()
  revokedAt?: Date;

  @Prop({ maxlength: 300 })
  revocationReason?: string;

  // Автоматическое истечение
  @Prop({ default: false })
  autoExpired: boolean;

  @Prop()
  autoExpiredAt?: Date;

  // Уведомления
  @Prop({ default: false })
  userNotified: boolean;

  @Prop()
  userNotifiedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const BlacklistEntrySchema = SchemaFactory.createForClass(BlacklistEntry);

// Индексы
BlacklistEntrySchema.index({ userId: 1, status: 1 });
BlacklistEntrySchema.index({ blockedBy: 1, createdAt: -1 });
BlacklistEntrySchema.index({ status: 1, expiresAt: 1 });
BlacklistEntrySchema.index({ reason: 1, status: 1 });
BlacklistEntrySchema.index({ approvedByAdmin: 1, status: 1 });
BlacklistEntrySchema.index({ createdAt: -1 });

// TTL индекс для автоматического удаления истекших записей
BlacklistEntrySchema.index(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'expired' } }
);