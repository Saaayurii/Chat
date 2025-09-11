import { api } from './config';
import type { 
  QuestionStats, 
  ComplaintStats, 
  RatingStats, 
  BlacklistStats,
  Complaint,
  UserRole 
} from '@/types';

export var statisticsAPI = {
  getUsersStats: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<{
      total: number;
      active: number;
      blocked: number;
      online: number;
      registeredToday: number;
      byRole: {
        admin: number;
        operator: number;
        visitor: number;
      };
    }>('/users/stats', { params }),

  getQuestionsStats: (params?: { dateFrom?: string; dateTo?: string; operatorId?: string }) =>
    api.get<QuestionStats>('/questions/stats', { params }),

  getComplaintsStats: (params?: { dateFrom?: string; dateTo?: string; operatorId?: string }) =>
    api.get<ComplaintStats>('/complaints/stats', { params }),

  getRatingsStats: (params?: { dateFrom?: string; dateTo?: string; operatorId?: string }) =>
    api.get<RatingStats>('/ratings/stats', { params }),

  getBlacklistStats: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<BlacklistStats>('/blacklist/stats', { params }),

  getQueueStats: () =>
    api.get<{ totalInQueue: number; averageWaitTime: number }>('/transfer/queue/stats'),

  getOperatorWorkload: (operatorId: string) =>
    api.get<{ activeQuestions: number; totalQuestions: number; closedToday: number }>(`/questions/operator/${operatorId}/workload`),

  getOperatorComplaintHistory: (operatorId: string) =>
    api.get<{
      complaints: Complaint[];
      totalComplaints: number;
      resolvedComplaints: number;
      warningsCount: number;
      suspensionsCount: number;
    }>(`/complaints/operator/${operatorId}/history`),

  getConversationsStats: (params?: { dateFrom?: string; dateTo?: string; operatorId?: string }) =>
    api.get<{
      totalConversations: number;
      activeConversations: number;
      closedConversations: number;
      averageMessages: number;
      averageResponseTime: number;
      byType: {
        userOperator: number;
        operatorOperator: number;
        operatorAdmin: number;
      };
    }>('/chat/conversations/stats', { params }),
};