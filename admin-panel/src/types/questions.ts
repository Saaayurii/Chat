export var QuestionStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
  TRANSFERRED: 'transferred',
} as const;

export var QuestionPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
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