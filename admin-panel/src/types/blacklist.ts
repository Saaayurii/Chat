import { User } from './user';

export var BlacklistReason = {
  SPAM: 'SPAM',
  INAPPROPRIATE_BEHAVIOR: 'INAPPROPRIATE_BEHAVIOR',
  HARASSMENT: 'HARASSMENT',
  VIOLATION_OF_TERMS: 'VIOLATION_OF_TERMS',
  FRAUD: 'FRAUD',
  OTHER: 'OTHER',
  ABUSE: 'ABUSE',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
} as const;

export var BlacklistType = {
  PERMANENT: 'PERMANENT',
  TEMPORARY: 'TEMPORARY',
} as const;

export var BlacklistStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export interface BlacklistEvidence {
  type: string;
  url: string;
  description?: string;
}

export interface BlacklistEntry {
  _id: string;
  userId: string | User;
  reason: keyof typeof BlacklistReason;
  description: string;
  type: keyof typeof BlacklistType;
  status: keyof typeof BlacklistStatus;
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
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlacklistEntryData {
  userId: string;
  reason: keyof typeof BlacklistReason;
  description: string;
  type?: keyof typeof BlacklistType;
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
  status?: keyof typeof BlacklistStatus;
  approvedByAdmin?: boolean;
  revocationReason?: string;
}

export interface BlacklistStats {
  statusStats: Array<{ _id: string; count: number }>;
  reasonStats: Array<{ _id: string; count: number }>;
}