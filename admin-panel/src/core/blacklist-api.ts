import { api } from './config';
import type { 
  BlacklistEntry, 
  CreateBlacklistEntryData, 
  ApproveBlacklistEntryData, 
  RevokeBlacklistEntryData, 
  UpdateBlacklistEntryData, 
  BlacklistStats,
  PaginationParams,
  BlacklistStatus,
  BlacklistReason,
  BlacklistType 
} from '@/types';

export var blacklistAPI = {
  createBlacklistEntry: (data: CreateBlacklistEntryData) =>
    api.post<BlacklistEntry>('/blacklist', data),

  getBlacklistEntries: (params?: PaginationParams & {
    status?: keyof typeof BlacklistStatus;
    reason?: keyof typeof BlacklistReason;
    type?: keyof typeof BlacklistType;
    userId?: string;
    blockedBy?: string;
    approvedByAdmin?: boolean;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ entries: BlacklistEntry[]; total: number }>('/blacklist', { params }),

  getBlacklistEntryById: (id: string) =>
    api.get<BlacklistEntry>(`/blacklist/${id}`),

  getBlacklistEntriesByUser: (userId: string) =>
    api.get<BlacklistEntry[]>(`/blacklist/user/${userId}`),

  checkUserBlacklist: (userId: string) =>
    api.get<{ isBlacklisted: boolean }>(`/blacklist/check/${userId}`),

  approveBlacklistEntry: (id: string, data: ApproveBlacklistEntryData) =>
    api.put<BlacklistEntry>(`/blacklist/${id}/approve`, data),

  revokeBlacklistEntry: (id: string, data: RevokeBlacklistEntryData) =>
    api.put<BlacklistEntry>(`/blacklist/${id}/revoke`, data),

  updateBlacklistEntry: (id: string, data: UpdateBlacklistEntryData) =>
    api.put<BlacklistEntry>(`/blacklist/${id}`, data),

  deleteBlacklistEntry: (id: string) =>
    api.delete(`/blacklist/${id}`),

  processExpiredEntries: () =>
    api.post('/blacklist/process-expired'),

  getBlacklistStats: () =>
    api.get<BlacklistStats>('/blacklist/stats'),
};