import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OperatorRatingDocument = OperatorRating & Document;

@Schema({ 
  timestamps: true,
  collection: 'operator_ratings'
})
export class OperatorRating {
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
    type: Number, 
    required: true,
    min: 1,
    max: 5
  })
  rating: number;

  @Prop({ 
    maxlength: 500,
    trim: true
  })
  comment?: string;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  relatedQuestionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  relatedConversationId?: Types.ObjectId;

  // Детализированные оценки
  @Prop({
    type: {
      professionalism: { type: Number, min: 1, max: 5 },
      responseTime: { type: Number, min: 1, max: 5 },
      helpfulness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      problemResolution: { type: Number, min: 1, max: 5 }
    },
    _id: false
  })
  detailedRating?: {
    professionalism: number;
    responseTime: number;
    helpfulness: number;
    communication: number;
    problemResolution: number;
  };

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ default: true })
  isVisible: boolean; // Может быть скрыт админом

  @Prop({ type: Types.ObjectId, ref: 'User' })
  hiddenBy?: Types.ObjectId;

  @Prop()
  hiddenReason?: string;

  @Prop()
  hiddenAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const OperatorRatingSchema = SchemaFactory.createForClass(OperatorRating);

// Индексы
OperatorRatingSchema.index({ visitorId: 1, operatorId: 1 });
OperatorRatingSchema.index({ operatorId: 1, isVisible: 1, createdAt: -1 });
OperatorRatingSchema.index({ rating: 1, operatorId: 1 });
OperatorRatingSchema.index({ relatedQuestionId: 1 });
OperatorRatingSchema.index({ createdAt: -1 });

// Уникальный индекс - один рейтинг за вопрос
OperatorRatingSchema.index(
  { visitorId: 1, relatedQuestionId: 1 }, 
  { unique: true, sparse: true }
);