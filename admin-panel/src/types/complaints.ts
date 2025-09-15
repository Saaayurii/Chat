export var ComplaintType = {
  INAPPROPRIATE_BEHAVIOR: 'INAPPROPRIATE_BEHAVIOR',
  POOR_SERVICE: 'POOR_SERVICE',
  UNPROFESSIONAL_CONDUCT: 'UNPROFESSIONAL_CONDUCT',
  DELAYED_RESPONSE: 'DELAYED_RESPONSE',
  INCORRECT_INFORMATION: 'INCORRECT_INFORMATION',
  OTHER: 'OTHER',
} as const;

export var ComplaintStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export var ComplaintSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export interface ComplaintEvidence {
  type: string;
  url: string;
  description?: string;
}

export interface Complaint {
  _id: string;
  type: keyof typeof ComplaintType;
  complaintText: string;
  severity: keyof typeof ComplaintSeverity;
  status: keyof typeof ComplaintStatus;
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
  type: keyof typeof ComplaintType;
  complaintText: string;
  operatorId: string;
  relatedQuestionId?: string;
  relatedConversationId?: string;
  severity?: keyof typeof ComplaintSeverity;
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
  status?: keyof typeof ComplaintStatus;
  severity?: keyof typeof ComplaintSeverity;
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