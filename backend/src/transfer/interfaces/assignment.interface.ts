import { Document } from 'mongoose';
import { AssignmentStatus } from '../enums/assignment-status.enum';

export interface Assignment extends Document {
  _id: string;
  operatorId: string;
  visitorId: string;
  chatId: string;
  assignedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  status: AssignmentStatus;
  transferId?: string;
  queueId?: string;
  metadata?: Record<string, any>;
}

export interface OperatorAssignment {
  operatorId: string;
  chatId: string;
  visitorId: string;
  assignmentType: 'transfer' | 'queue' | 'direct';
  sourceId?: string;
  estimatedWait?: number;
  priority?: number;
}

export interface AssignmentNotification {
  assignmentId: string;
  operatorId: string;
  chatId: string;
  visitorId: string;
  type: 'new_assignment' | 'transfer_request' | 'queue_assignment';
  data?: Record<string, any>;
}