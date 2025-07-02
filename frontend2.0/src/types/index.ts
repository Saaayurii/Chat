// User Types
export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VISITOR = 'visitor',
}

export interface User {
  _id: string;
  id: string;
  email: string;
  role: UserRole;
  isActivated: boolean;
  isBlocked: boolean;
  blacklistedByAdmin: boolean;
  blacklistedByOperator: boolean;
  profile: {
    username: string;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    lastSeenAt: Date;
    isOnline: boolean;
  };
  operatorStats?: {
    totalQuestions: number;
    resolvedQuestions: number;
    averageRating: number;
    totalRatings: number;
    responseTimeAvg: number;
  };
  deletionInfo?: {
    deletedAt: Date;
    deletedBy: string;
    reason: string;
    additionalInfo: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Types
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

export interface Conversation {
  _id: string;
  participants: string[];
  type: ConversationType;
  status: ConversationStatus;
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

// Message Types
export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
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
  type: MessageType;
  text: string;
  attachments?: MessageAttachment[];
  status: MessageStatus;
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

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Statistics
export interface StatisticsData {
  totalMessages: number;
  totalOperators: number;
  totalVisitors: number;
  onlineOperators: number;
  totalUsers: number;
  activeConversations: number;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}