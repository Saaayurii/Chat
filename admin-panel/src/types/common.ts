export var UserRole = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  VISITOR: 'VISITOR',
} as const;

export var ConversationType = {
  USER_OPERATOR: 'USER_OPERATOR',
  OPERATOR_OPERATOR: 'OPERATOR_OPERATOR',
  OPERATOR_ADMIN: 'OPERATOR_ADMIN',
} as const;

export var ConversationStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  TRANSFERRED: 'TRANSFERRED',
} as const;

export var MessageType = {
  TEXT: 'TEXT',
  FILE: 'FILE',
  IMAGE: 'IMAGE',
  SYSTEM: 'SYSTEM',
} as const;

export var MessageStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
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