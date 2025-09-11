import { ConversationType, ConversationStatus, MessageType, MessageStatus, PaginationParams } from './common';

export interface Conversation {
  _id: string;
  participants: string[];
  type: keyof typeof ConversationType;
  status: keyof typeof ConversationStatus;
  relatedQuestionId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
    messageId: string;
  };
  unreadMessagesCount: number;
  unreadByParticipant: Record<string, number>;
  transferredFrom?: string;
  transferredTo?: string;
  transferReason?: string;
  closedAt?: Date;
  closedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  type: keyof typeof MessageType;
  text: string;
  attachments?: MessageAttachment[];
  status: keyof typeof MessageStatus;
  isEdited: boolean;
  editedAt?: Date;
  originalText?: string;
  readBy: string[];
  readTimestamps: Record<string, Date>;
  systemData?: {
    action: string;
    fromUserId?: string;
    toUserId?: string;
    metadata?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationData {
  participantIds: string[];
  type: string;
}

export interface SendMessageData {
  text: string;
  type?: string;
}

export interface GetMessagesParams extends PaginationParams {
  limit?: number;
  skip?: number;
}