import { api } from './config';
import type { UserRole } from '@/types';

export var transferAPI = {
  getOperators: () =>
    api.get<{
      id: string;
      email: string;
      profile: {
        username: string;
        fullName: string;
        avatarUrl?: string;
        isOnline: boolean;
        status?: 'free' | 'busy' | 'break' | 'offline';
      };
      role: keyof typeof UserRole;
      activeChats: number;
      lastActivity: string;
    }[]>('/users/operators'),

  transferChat: (conversationId: string, operatorId: string) =>
    api.post(`/transfer/request`, { chatId: conversationId, toOperatorId: operatorId }),

  getPendingTransferRequests: () =>
    api.get<{
      id: string;
      fromOperator: {
        id: string;
        name: string;
        avatar?: string;
      };
      visitor: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
      };
      conversationId: string;
      reason?: string;
      timestamp: string;
    }[]>('/transfer/pending'),

  respondToTransfer: (transferId: string, accepted: boolean) =>
    api.put(`/transfer/respond`, { transferId, accepted }),

  blockUser: (userId: string, data: { reason: string; comment: string; conversationId: string }) =>
    api.post('/blacklist', { userId, reason: data.reason, comment: data.comment, conversationId: data.conversationId }),
};