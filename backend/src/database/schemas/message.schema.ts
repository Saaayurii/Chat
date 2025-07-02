import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system', // Системные сообщения (перевод, присоединение и т.д.)
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Schema({ 
  timestamps: true,
  collection: 'messages'
})
export class Message {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true
  })
  conversationId: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  senderId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: MessageType, 
    default: MessageType.TEXT 
  })
  type: MessageType;

  @Prop({ 
    required: true,
    maxlength: 2000
  })
  text: string;

  @Prop([{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true }
  }])
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];

  @Prop({ 
    type: String, 
    enum: MessageStatus, 
    default: MessageStatus.SENT 
  })
  status: MessageStatus;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt?: Date;

  @Prop()
  originalText?: string; // Сохраняем оригинальный текст при редактировании

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  readBy: Types.ObjectId[]; // Кто прочитал сообщение

  @Prop({ type: Map, of: Date })
  readTimestamps: Map<string, Date>; // userId -> время прочтения

  // Для системных сообщений
  @Prop({
    type: {
      action: { type: String }, // 'transfer', 'join', 'leave', 'close'
      fromUserId: { type: Types.ObjectId, ref: 'User' },
      toUserId: { type: Types.ObjectId, ref: 'User' },
      metadata: { type: Object }
    },
    _id: false
  })
  systemData?: {
    action: string;
    fromUserId?: Types.ObjectId;
    toUserId?: Types.ObjectId;
    metadata?: Record<string, unknown>;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Индексы
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ status: 1, conversationId: 1 });
MessageSchema.index({ type: 1 });

