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

// Email Types
export interface SendEmailData {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface SendTemplateEmailData {
  to: string[];
  template: string;
  variables: Record<string, any>;
}

// Questions Types
export enum QuestionStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred',
}

export enum QuestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Question {
  _id: string;
  text: string;
  status: QuestionStatus;
  priority: QuestionPriority;
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
  priority?: QuestionPriority;
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
  status?: QuestionStatus;
  priority?: QuestionPriority;
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

// Complaints Types
export enum ComplaintType {
  INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR',
  POOR_SERVICE = 'POOR_SERVICE',
  UNPROFESSIONAL_CONDUCT = 'UNPROFESSIONAL_CONDUCT',
  DELAYED_RESPONSE = 'DELAYED_RESPONSE',
  INCORRECT_INFORMATION = 'INCORRECT_INFORMATION',
  OTHER = 'OTHER',
}

export enum ComplaintStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ComplaintSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ComplaintEvidence {
  type: string;
  url: string;
  description?: string;
}

export interface Complaint {
  _id: string;
  type: ComplaintType;
  complaintText: string;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  evidence?: ComplaintEvidence[];
  visitorId: string;
  operatorId: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  resolvedAt?: Date;
  adminResponse?: string;
  resolutionNotes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  operatorWarned?: boolean;
  operatorSuspended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComplaintData {
  type: ComplaintType;
  complaintText: string;
  operatorId: string;
  relatedQuestionId?: string;
  relatedConversationId?: string;
  severity?: ComplaintSeverity;
  evidence?: ComplaintEvidence[];
}

export interface ReviewComplaintData {
  decision: 'resolved' | 'dismissed';
  adminResponse: string;
  resolutionNotes?: string;
  warnOperator?: boolean;
  suspendOperator?: boolean;
  suspensionDuration?: number;
}

export interface UpdateComplaintData {
  status?: ComplaintStatus;
  severity?: ComplaintSeverity;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

export interface ComplaintStats {
  statusStats: Array<{ _id: string; count: number }>;
  typeStats: Array<{ _id: string; count: number }>;
  severityStats: Array<{ _id: string; count: number }>;
  operatorStats: Array<{ _id: string; count: number }>;
  avgResolutionTimeHours: number;
}

// Blacklist Types
export enum BlacklistReason {
  SPAM = 'SPAM',
  INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR',
  HARASSMENT = 'HARASSMENT',
  VIOLATION_OF_TERMS = 'VIOLATION_OF_TERMS',
  FRAUD = 'FRAUD',
  OTHER = 'OTHER',
}

export enum BlacklistType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
}

export enum BlacklistStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending',
}

export interface BlacklistEvidence {
  type: string;
  url: string;
  description?: string;
}

export interface BlacklistEntry {
  _id: string;
  userId: string | User;
  reason: BlacklistReason;
  description: string;
  type: BlacklistType;
  status: BlacklistStatus;
  severity?: number;
  evidence?: BlacklistEvidence[];
  expiresAt?: Date;
  blockedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  approvedByAdmin?: boolean;
  revokedBy?: string;
  revokedAt?: Date;
  revocationReason?: string;
  relatedComplaints?: string[];
  relatedMessages?: string[];
  userNotified?: boolean;
  userNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlacklistEntryData {
  userId: string;
  reason: BlacklistReason;
  description: string;
  type?: BlacklistType;
  severity?: number;
  relatedComplaints?: string[];
  relatedMessages?: string[];
  evidence?: BlacklistEvidence[];
}

export interface ApproveBlacklistEntryData {
  approved: boolean;
  comments?: string;
}

export interface RevokeBlacklistEntryData {
  revocationReason: string;
}

export interface UpdateBlacklistEntryData {
  status?: BlacklistStatus;
  approvedByAdmin?: boolean;
  revocationReason?: string;
}

export interface BlacklistStats {
  statusStats: Array<{ _id: string; count: number }>;
  reasonStats: Array<{ _id: string; count: number }>;
}

// Ratings Types
export interface DetailedRating {
  professionalism: number;
  responseTime: number;
  helpfulness: number;
  communication: number;
  problemResolution: number;
}

export interface Rating {
  _id: string;
  operatorId: string;
  visitorId: string;
  rating: number;
  comment?: string;
  relatedQuestionId?: string;
  relatedConversationId?: string;
  detailedRating?: DetailedRating;
  isAnonymous: boolean;
  isVisible: boolean;
  hiddenBy?: string;
  hiddenReason?: string;
  hiddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRatingData {
  operatorId: string;
  rating: number;
  comment?: string;
  relatedQuestionId?: string;
  relatedConversationId?: string;
  detailedRating?: DetailedRating;
  isAnonymous?: boolean;
}

export interface UpdateRatingVisibilityData {
  isVisible: boolean;
  hiddenReason?: string;
}

export interface HideRatingData {
  hiddenReason: string;
}

export interface OperatorRatingStats {
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: Record<string, number>;
  detailedAverages: {
    avgProfessionalism: number;
    avgResponseTime: number;
    avgHelpfulness: number;
    avgCommunication: number;
    avgProblemResolution: number;
  };
}

export interface RatingStats {
  overall: {
    totalRatings: number;
    averageRating: number;
    minRating: number;
    maxRating: number;
  };
  distribution: Array<{ _id: number; count: number }>;
  topOperators: Array<{
    _id: string;
    averageRating: number;
    totalRatings: number;
    operator: any;
  }>;
}