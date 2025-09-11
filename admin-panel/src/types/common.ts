export var UserRole = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VISITOR: 'visitor',
} as const;

export var ConversationType = {
  USER_OPERATOR: 'user-operator',
  OPERATOR_OPERATOR: 'operator-operator',
  OPERATOR_ADMIN: 'operator-admin',
} as const;

export var ConversationStatus = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  TRANSFERRED: 'transferred',
} as const;

export var MessageType = {
  TEXT: 'text',
  FILE: 'file',
  IMAGE: 'image',
  SYSTEM: 'system',
} as const;

export var MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

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

export interface CachedResponse<T> {
  messages: T[];
  fromCache: boolean;
  cacheInfo: {
    totalCached: number;
    lastCached: number | null;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface StatisticsData {
  totalMessages: number;
  totalOperators: number;
  totalVisitors: number;
  onlineOperators: number;
  totalUsers: number;
  activeConversations: number;
}