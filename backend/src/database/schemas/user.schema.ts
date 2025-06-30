import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VISITOR = 'visitor',
}
@Schema({ 
  timestamps: true,
  collection: 'users'
})
export class User {
  // MongoDB автоматически добавляет _id, но для TypeScript нужно объявить
  _id: Types.ObjectId;
  @Prop({ 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ 
    type: String, 
    enum: UserRole, 
    default: UserRole.VISITOR 
  })
  role: UserRole;

  @Prop({ default: false })
  isActivated: boolean;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: false })
  blacklistedByAdmin: boolean;

  @Prop({ default: false })
  blacklistedByOperator: boolean;

  @Prop({
    type: {
      username: { type: String, required: true, trim: true },
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      avatarUrl: { type: String },
      bio: { type: String, maxlength: 500 },
      lastSeenAt: { type: Date, default: Date.now },
      isOnline: { type: Boolean, default: false }
    },
    _id: false
  })
  profile: {
    username: string;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    lastSeenAt: Date;
    isOnline: boolean;
  };

  // Статистика для операторов
  @Prop({
    type: {
      totalQuestions: { type: Number, default: 0 },
      resolvedQuestions: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      responseTimeAvg: { type: Number, default: 0 } // в минутах
    },
    _id: false
  })
  operatorStats?: {
    totalQuestions: number;
    resolvedQuestions: number;
    averageRating: number;
    totalRatings: number;
    responseTimeAvg: number;
  };

  // Информация об удалении (для мягкого удаления)
  @Prop({
    type: {
      deletedAt: { type: Date },
      deletedBy: { type: Types.ObjectId, ref: 'User' },
      reason: { type: String },
      additionalInfo: { type: String }
    },
    _id: false
  })
  deletionInfo?: {
    deletedAt: Date;
    deletedBy: Types.ObjectId;
    reason: string;
    additionalInfo: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Индексы для оптимизации (email уже имеет unique индекс из декоратора @Prop)
UserSchema.index({ role: 1, isBlocked: 1 });
UserSchema.index({ 'profile.username': 1 });
UserSchema.index({ 'profile.isOnline': 1, role: 1 });
UserSchema.index({ createdAt: -1 });

// Дополнительные индексы
UserSchema.index({ 'deletionInfo.deletedAt': 1 });
UserSchema.index({ isActivated: 1 });

// Виртуальные поля
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Убеждаемся, что виртуальные поля включены в JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});