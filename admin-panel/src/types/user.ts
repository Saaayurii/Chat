import { UserRole } from './common';

export interface User {
  _id: string;
  id: string;
  email: string;
  role: keyof typeof UserRole;
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

export type ChatUser = User;

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  role?: keyof typeof UserRole;
}

export interface CreateOperatorData {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  role?: keyof typeof UserRole;
}

export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
}