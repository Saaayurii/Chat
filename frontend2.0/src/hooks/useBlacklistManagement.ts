'use client';

import { useState, useEffect } from 'react';
import { blacklistAPI } from '@/core/api';
import { 
  BlacklistEntry, 
  BlacklistStatus, 
  BlacklistReason, 
  BlacklistType,
  CreateBlacklistEntryData,
  ApproveBlacklistEntryData,
  RevokeBlacklistEntryData,
  UserRole 
} from '@/types';

interface UseBlacklistManagementProps {
  userRole?: UserRole;
}

export const useBlacklistManagement = ({ userRole }: UseBlacklistManagementProps) => {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [statusFilter, setStatusFilter] = useState<BlacklistStatus | ''>('');
  const [reasonFilter, setReasonFilter] = useState<BlacklistReason | ''>('');
  const [typeFilter, setTypeFilter] = useState<BlacklistType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const canManageBlacklist = userRole === UserRole.ADMIN;

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(reasonFilter && { reason: reasonFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      const response = await blacklistAPI.getBlacklistEntries(params);
      setEntries(response.data.entries);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке черного списка');
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (data: CreateBlacklistEntryData) => {
    try {
      setLoading(true);
      await blacklistAPI.createBlacklistEntry(data);
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании записи');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveEntry = async (entryId: string, data: ApproveBlacklistEntryData) => {
    try {
      setLoading(true);
      await blacklistAPI.approveBlacklistEntry(entryId, data);
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при одобрении записи');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const revokeEntry = async (entryId: string, data: RevokeBlacklistEntryData) => {
    try {
      setLoading(true);
      await blacklistAPI.revokeBlacklistEntry(entryId, data);
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отмене записи');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageBlacklist) {
      loadEntries();
    }
  }, [currentPage, statusFilter, reasonFilter, typeFilter, searchQuery, canManageBlacklist]);

  return {
    entries,
    loading,
    error,
    currentPage,
    totalPages,
    statusFilter,
    reasonFilter,
    typeFilter,
    searchQuery,
    canManageBlacklist,
    setCurrentPage,
    setStatusFilter,
    setReasonFilter,
    setTypeFilter,
    setSearchQuery,
    setError,
    createEntry,
    approveEntry,
    revokeEntry,
    loadEntries
  };
};