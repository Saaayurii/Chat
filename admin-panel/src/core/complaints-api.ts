import { api } from './config';
import type { 
  Complaint, 
  CreateComplaintData, 
  ReviewComplaintData, 
  UpdateComplaintData, 
  ComplaintStats,
  PaginationParams,
  ComplaintStatus,
  ComplaintType,
  ComplaintSeverity 
} from '@/types';

export var complaintsAPI = {
  createComplaint: (data: CreateComplaintData) =>
    api.post<Complaint>('/complaints', data),

  getComplaints: (params?: PaginationParams & {
    status?: keyof typeof ComplaintStatus;
    type?: keyof typeof ComplaintType;
    severity?: keyof typeof ComplaintSeverity;
    operatorId?: string;
    visitorId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ complaints: Complaint[]; total: number }>('/complaints', { params }),

  getMyComplaints: () =>
    api.get<Complaint[]>('/complaints/my'),

  getComplaintById: (id: string) =>
    api.get<Complaint>(`/complaints/${id}`),

  getComplaintsByOperator: (operatorId: string) =>
    api.get<Complaint[]>(`/complaints/operator/${operatorId}`),

  getOperatorComplaintHistory: (operatorId: string) =>
    api.get<{
      complaints: Complaint[];
      totalComplaints: number;
      resolvedComplaints: number;
      warningsCount: number;
      suspensionsCount: number;
    }>(`/complaints/operator/${operatorId}/history`),

  reviewComplaint: (id: string, data: ReviewComplaintData) =>
    api.put<Complaint>(`/complaints/${id}/review`, data),

  updateComplaint: (id: string, data: UpdateComplaintData) =>
    api.put<Complaint>(`/complaints/${id}`, data),

  deleteComplaint: (id: string) =>
    api.delete(`/complaints/${id}`),

  getComplaintStats: () =>
    api.get<ComplaintStats>('/complaints/stats'),
};