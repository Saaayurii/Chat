export var QuestionStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
  TRANSFERRED: 'TRANSFERRED',
} as const;

export var QuestionPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export interface Question {
  _id: string;
  text: string;
  status: keyof typeof QuestionStatus;
  priority: keyof typeof QuestionPriority;
  category: string;
  tags?: string[];
  visitorId: string;
  operatorId?: string;
  assignedAt?: Date;
  firstResponseAt?: Date;
  closedAt?: Date;
  closedBy?: string;
  transferHistory?: TransferHistoryEntry[];
  resolutionTimeMinutes?: number;
  messagesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferHistoryEntry {
  fromOperatorId: string;
  toOperatorId: string;
  reason: string;
  transferredAt: Date;
}

export interface CreateQuestionData {
  text: string;
  priority?: keyof typeof QuestionPriority;
  category: string;
  tags?: string[];
}

export interface AssignOperatorData {
  operatorId: string;
}

export interface TransferQuestionData {
  operatorId: string;
  reason: string;
}

export interface CloseQuestionData {
  closingComment?: string;
}

export interface UpdateQuestionData {
  text?: string;
  status?: keyof typeof QuestionStatus;
  priority?: keyof typeof QuestionPriority;
  category?: string;
  tags?: string[];
}

export interface QuestionStats {
  statusStats: Array<{ _id: string; count: number }>;
  priorityStats: Array<{ _id: string; count: number }>;
  categoryStats: Array<{ _id: string; count: number }>;
  avgResponseTime: number;
  avgResolutionTime: number;
}