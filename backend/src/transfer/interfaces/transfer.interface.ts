import { Document } from 'mongoose';
import { TransferStatus } from '../enums/transfer-status.enum';

export interface Transfer extends Document {
  _id: string;
  fromOperatorId: string;
  toOperatorId: string;
  chatId: string;
  visitorId: string;
  status: TransferStatus;
  reason?: string;
  requestedAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
  note?: string;
}

export interface TransferRequest {
  fromOperatorId: string;
  toOperatorId: string;
  chatId: string;
  visitorId: string;
  reason?: string;
  note?: string;
}

export interface TransferResponse {
  transferId: string;
  accepted: boolean;
  reason?: string;
}