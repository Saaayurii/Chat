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
import { useAuthStore } from '@/store/authStore';

interface BlacklistManagementProps {
  userRole?: UserRole;
  showCreateForm?: boolean;
}

export default function BlacklistManagement({ 
  userRole, 
  showCreateForm = true 
}: BlacklistManagementProps) {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<BlacklistStatus | ''>('');
  const [reasonFilter, setReasonFilter] = useState<BlacklistReason | ''>('');
  const [typeFilter, setTypeFilter] = useState<BlacklistType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateBlacklistEntryData>({
    userId: '',
    reason: BlacklistReason.SPAM,
    description: '',
    type: BlacklistType.TEMPORARY,
    severity: 1
  });
  
  // Action forms
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRevokeForm, setShowRevokeForm] = useState(false);
  const [approveData, setApproveData] = useState<ApproveBlacklistEntryData>({
    approved: true,
    comments: ''
  });
  const [revokeData, setRevokeData] = useState<RevokeBlacklistEntryData>({
    revocationReason: ''
  });

  const canManageBlacklist = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (canManageBlacklist) {
      loadEntries();
    }
  }, [currentPage, statusFilter, reasonFilter, typeFilter, searchQuery, canManageBlacklist]);

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

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBlacklist) return;

    try {
      setLoading(true);
      await blacklistAPI.createBlacklistEntry(formData);
      setShowForm(false);
      setFormData({
        userId: '',
        reason: BlacklistReason.SPAM,
        description: '',
        type: BlacklistType.TEMPORARY,
        severity: 1
      });
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании записи в черном списке');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !canManageBlacklist) return;

    try {
      setLoading(true);
      await blacklistAPI.approveBlacklistEntry(selectedEntry._id, approveData);
      setShowApproveForm(false);
      setSelectedEntry(null);
      setApproveData({ approved: true, comments: '' });
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при одобрении записи');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !canManageBlacklist) return;

    try {
      setLoading(true);
      await blacklistAPI.revokeBlacklistEntry(selectedEntry._id, revokeData);
      setShowRevokeForm(false);
      setSelectedEntry(null);
      setRevokeData({ revocationReason: '' });
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отмене блокировки');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: BlacklistStatus) => {
    switch (status) {
      case BlacklistStatus.ACTIVE: return 'bg-red-100 text-red-800';
      case BlacklistStatus.EXPIRED: return 'bg-gray-100 text-gray-800';
      case BlacklistStatus.REVOKED: return 'bg-green-100 text-green-800';
      case BlacklistStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: BlacklistType) => {
    switch (type) {
      case BlacklistType.PERMANENT: return 'bg-red-100 text-red-800';
      case BlacklistType.TEMPORARY: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonDisplay = (reason: BlacklistReason) => {
    const reasonMap = {
      [BlacklistReason.SPAM]: 'Спам',
      [BlacklistReason.INAPPROPRIATE_BEHAVIOR]: 'Неподобающее поведение',
      [BlacklistReason.HARASSMENT]: 'Домогательства',
      [BlacklistReason.VIOLATION_OF_TERMS]: 'Нарушение условий',
      [BlacklistReason.FRAUD]: 'Мошенничество',
      [BlacklistReason.OTHER]: 'Другое'
    };
    return reasonMap[reason] || reason;
  };

  if (!canManageBlacklist) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">У вас нет прав для просмотра черного списка</p>
      </div>
    );
  }

  if (loading && entries.length === 0) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление черным списком</h2>
        {showCreateForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Заблокировать пользователя
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BlacklistStatus | '')}
          className="border rounded px-3 py-2"
        >
          <option value="">Все статусы</option>
          <option value={BlacklistStatus.ACTIVE}>Активна</option>
          <option value={BlacklistStatus.EXPIRED}>Истекла</option>
          <option value={BlacklistStatus.REVOKED}>Отменена</option>
          <option value={BlacklistStatus.PENDING}>Ожидает</option>
        </select>

        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value as BlacklistReason | '')}
          className="border rounded px-3 py-2"
        >
          <option value="">Все причины</option>
          <option value={BlacklistReason.SPAM}>Спам</option>
          <option value={BlacklistReason.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</option>
          <option value={BlacklistReason.HARASSMENT}>Домогательства</option>
          <option value={BlacklistReason.VIOLATION_OF_TERMS}>Нарушение условий</option>
          <option value={BlacklistReason.FRAUD}>Мошенничество</option>
          <option value={BlacklistReason.OTHER}>Другое</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as BlacklistType | '')}
          className="border rounded px-3 py-2"
        >
          <option value="">Все типы</option>
          <option value={BlacklistType.PERMANENT}>Постоянная</option>
          <option value={BlacklistType.TEMPORARY}>Временная</option>
        </select>

        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{getReasonDisplay(entry.reason)}</h3>
                <p className="text-gray-700 mt-2">{entry.description}</p>
                {entry.severity && (
                  <p className="text-sm text-gray-600 mt-1">Серьезность: {entry.severity}/5</p>
                )}
              </div>
              <div className="flex gap-2 flex-col">
                <span className={`px-2 py-1 rounded text-sm text-center ${getStatusColor(entry.status)}`}>
                  {entry.status}
                </span>
                <span className={`px-2 py-1 rounded text-sm text-center ${getTypeColor(entry.type)}`}>
                  {entry.type}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-3">
              <p>Создана: {new Date(entry.createdAt).toLocaleString()}</p>
              {entry.expiresAt && (
                <p>Истекает: {new Date(entry.expiresAt).toLocaleString()}</p>
              )}
              {entry.approvedAt && (
                <p>Одобрена: {new Date(entry.approvedAt).toLocaleString()}</p>
              )}
              {entry.revokedAt && (
                <p>Отменена: {new Date(entry.revokedAt).toLocaleString()}</p>
              )}
              {entry.userNotified && (
                <p className="text-green-600">Пользователь уведомлен</p>
              )}
            </div>

            <div className="flex gap-2">
              {entry.status === BlacklistStatus.PENDING && (
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowApproveForm(true);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Рассмотреть
                </button>
              )}
              {entry.status === BlacklistStatus.ACTIVE && (
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowRevokeForm(true);
                  }}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                >
                  Отменить блокировку
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span className="px-3 py-1">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}

      {/* Create Entry Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Заблокировать пользователя</h3>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <input
                type="text"
                placeholder="ID пользователя"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />

              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value as BlacklistReason })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value={BlacklistReason.SPAM}>Спам</option>
                <option value={BlacklistReason.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</option>
                <option value={BlacklistReason.HARASSMENT}>Домогательства</option>
                <option value={BlacklistReason.VIOLATION_OF_TERMS}>Нарушение условий</option>
                <option value={BlacklistReason.FRAUD}>Мошенничество</option>
                <option value={BlacklistReason.OTHER}>Другое</option>
              </select>

              <textarea
                placeholder="Описание причины блокировки..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2 h-24"
                required
              />

              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as BlacklistType })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={BlacklistType.TEMPORARY}>Временная блокировка</option>
                <option value={BlacklistType.PERMANENT}>Постоянная блокировка</option>
              </select>

              <div>
                <label className="block text-sm font-medium mb-1">Серьезность (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? 'Блокировка...' : 'Заблокировать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Entry Form */}
      {showApproveForm && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Рассмотреть блокировку</h3>
            <form onSubmit={handleApproveEntry} className="space-y-4">
              <select
                value={approveData.approved ? 'true' : 'false'}
                onChange={(e) => setApproveData({ ...approveData, approved: e.target.value === 'true' })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="true">Одобрить блокировку</option>
                <option value="false">Отклонить блокировку</option>
              </select>

              <textarea
                placeholder="Комментарии (необязательно)"
                value={approveData.comments}
                onChange={(e) => setApproveData({ ...approveData, comments: e.target.value })}
                className="w-full border rounded px-3 py-2 h-20"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Обработка...' : 'Принять решение'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApproveForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Entry Form */}
      {showRevokeForm && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Отменить блокировку</h3>
            <form onSubmit={handleRevokeEntry} className="space-y-4">
              <textarea
                placeholder="Причина отмены блокировки..."
                value={revokeData.revocationReason}
                onChange={(e) => setRevokeData({ ...revokeData, revocationReason: e.target.value })}
                className="w-full border rounded px-3 py-2 h-24"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Отмена...' : 'Отменить блокировку'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevokeForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}