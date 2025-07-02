'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BlacklistEntry, CreateBlacklistEntryData, ApproveBlacklistEntryData, RevokeBlacklistEntryData, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBlacklistManagement } from '@/hooks/useBlacklistManagement';

const BlacklistFilter = dynamic(() => import('./BlacklistFilter'), {
  loading: () => <div className="bg-gray-50 p-4 rounded-lg animate-pulse h-16" />
});

const BlacklistList = dynamic(() => import('./BlacklistList'), {
  loading: () => <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 h-32 bg-gray-50" />
    ))}
  </div>
});

const CreateEntryForm = dynamic(() => import('./CreateEntryForm'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-96" />
  </div>
});

const ApproveEntryForm = dynamic(() => import('./ApproveEntryForm'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-64" />
  </div>
});

const RevokeEntryForm = dynamic(() => import('./RevokeEntryForm'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-48" />
  </div>
});

interface BlacklistManagementProps {
  userRole?: UserRole;
  showCreateForm?: boolean;
}

export default function BlacklistManagement({ 
  userRole, 
  showCreateForm = true 
}: BlacklistManagementProps) {
  const { user } = useAuthStore();

  const {
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
    revokeEntry
  } = useBlacklistManagement({ userRole: user?.role });

  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRevokeForm, setShowRevokeForm] = useState(false);

  const handleCreateEntry = async (data: CreateBlacklistEntryData) => {
    await createEntry(data);
    setShowForm(false);
  };

  const handleApproveEntry = (entry: BlacklistEntry) => {
    setSelectedEntry(entry);
    setShowApproveForm(true);
  };

  const handleApproveEntrySubmit = async (data: ApproveBlacklistEntryData) => {
    if (selectedEntry) {
      await approveEntry(selectedEntry._id, data);
      setShowApproveForm(false);
      setSelectedEntry(null);
    }
  };

  const handleRevokeEntry = (entry: BlacklistEntry) => {
    setSelectedEntry(entry);
    setShowRevokeForm(true);
  };

  const handleRevokeEntrySubmit = async (data: RevokeBlacklistEntryData) => {
    if (selectedEntry) {
      await revokeEntry(selectedEntry._id, data);
      setShowRevokeForm(false);
      setSelectedEntry(null);
    }
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
    <Suspense fallback={<div className="flex justify-center p-8">Загрузка...</div>}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

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

        <BlacklistFilter
          statusFilter={statusFilter}
          reasonFilter={reasonFilter}
          typeFilter={typeFilter}
          searchQuery={searchQuery}
          onStatusFilterChange={setStatusFilter}
          onReasonFilterChange={setReasonFilter}
          onTypeFilterChange={setTypeFilter}
          onSearchQueryChange={setSearchQuery}
        />

        <BlacklistList
          entries={entries}
          userRole={user?.role}
          onApprove={handleApproveEntry}
          onRevoke={handleRevokeEntry}
        />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Назад</button>
            <span className="px-3 py-1">Страница {currentPage} из {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Вперед</button>
          </div>
        )}

        {showForm && (
          <CreateEntryForm
            loading={loading}
            onSubmit={handleCreateEntry}
            onClose={() => setShowForm(false)}
          />
        )}

        {showApproveForm && selectedEntry && (
          <ApproveEntryForm
            loading={loading}
            onSubmit={handleApproveEntrySubmit}
            onClose={() => setShowApproveForm(false)}
          />
        )}

        {showRevokeForm && selectedEntry && (
          <RevokeEntryForm
            loading={loading}
            onSubmit={handleRevokeEntrySubmit}
            onClose={() => setShowRevokeForm(false)}
          />
        )}
      </div>
    </Suspense>
  );
}