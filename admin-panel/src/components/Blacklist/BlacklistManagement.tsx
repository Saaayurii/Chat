'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BlacklistEntry, CreateBlacklistEntryData, ApproveBlacklistEntryData, RevokeBlacklistEntryData, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBlacklistManagement } from '@/hooks/useBlacklistManagement';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI';
import Button from '../UI/Button';

const BlacklistFilter = dynamic(() => import('./BlacklistFilter'), {
  loading: () => <div className="bg-muted p-4 rounded-lg animate-pulse h-16" />
});

const BlacklistList = dynamic(() => import('./BlacklistList'), {
  loading: () => <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border border-border rounded-lg p-4 h-32 bg-muted" />
    ))}
  </div>
});

const CreateEntryForm = dynamic(() => import('./CreateEntryForm'), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-96 border border-border shadow-lg" />
  </div>
});

const ApproveEntryForm = dynamic(() => import('./ApproveEntryForm'), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-64 border border-border shadow-lg" />
  </div>
});

const RevokeEntryForm = dynamic(() => import('./RevokeEntryForm'), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-48 border border-border shadow-lg" />
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
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground">У вас нет прав для просмотра черного списка</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="text-muted-foreground">Загрузка...</div></div>}>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-foreground">Управление черным списком</CardTitle>
              {showCreateForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  variant="destructive"
                  className="hover:bg-destructive/90 focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                >
                  Заблокировать пользователя
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

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
                <Button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  variant="outline"
                  className="hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </Button>
                <span className="px-3 py-2 text-sm text-muted-foreground self-center">
                  Страница {currentPage} из {totalPages}
                </span>
                <Button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  variant="outline"
                  className="hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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