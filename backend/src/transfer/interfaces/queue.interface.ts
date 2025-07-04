import { Document } from 'mongoose';
import { AssignmentStatus } from '../enums/assignment-status.enum';

export interface Queue extends Document {
  _id: string;
  visitorId: string;
  chatId: string;
  priority: number;
  queuedAt: Date;
  assignedAt?: Date;
  assignedOperatorId?: string;
  status: AssignmentStatus;
  estimatedWaitTime?: number;
  tags?: string[];
}

export interface QueuePosition {
  queueId: string;
  position: number;
  estimatedWait: number;
  totalInQueue: number;
}

export interface QueueAssignment {
  queueId: string;
  operatorId: string;
  chatId: string;
  visitorId: string;
  assignedAt: Date;
}