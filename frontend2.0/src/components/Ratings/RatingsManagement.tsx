'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Rating, CreateRatingData, HideRatingData, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useRatingsManagement } from '@/hooks/useRatingsManagement';

const RatingsStats = dynamic(() => import('./RatingsStats'), {
  loading: () => <div className="bg-blue-50 p-4 rounded-lg animate-pulse h-32" />
});

const RatingsFilter = dynamic(() => import('./RatingsFilter'), {
  loading: () => <div className="bg-gray-50 p-4 rounded-lg animate-pulse h-16" />
});

const RatingsList = dynamic(() => import('./RatingsList'), {
  loading: () => <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 h-32 bg-gray-50" />
    ))}
  </div>
});

const CreateRatingForm = dynamic(() => import('./CreateRatingForm'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 animate-pulse h-96" />
  </div>
});

const HideRatingForm = dynamic(() => import('./HideRatingForm'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 animate-pulse h-48" />
  </div>
});

interface RatingsManagementProps {
  userRole?: UserRole;
  showCreateForm?: boolean;
  operatorId?: string;
}

export default function RatingsManagement({ 
  userRole, 
  showCreateForm = true,
  operatorId 
}: RatingsManagementProps) {
  const { user } = useAuthStore();
  
  const {
    ratings,
    operatorStats,
    loading,
    error,
    currentPage,
    totalPages,
    minRating,
    maxRating,
    isVisibleFilter,
    searchQuery,
    canManageRatings,
    canViewRatings,
    setCurrentPage,
    setMinRating,
    setMaxRating,
    setIsVisibleFilter,
    setSearchQuery,
    setError,
    createRating,
    hideRating
  } = useRatingsManagement({ operatorId, userRole: user?.role });

  const [showForm, setShowForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [showHideForm, setShowHideForm] = useState(false);

  const canCreateRatings = user?.role === UserRole.VISITOR;

  const handleCreateRating = async (formData: CreateRatingData) => {
    try {
      await createRating(formData);
      setShowForm(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleHideRating = async (rating: Rating) => {
    setSelectedRating(rating);
    setShowHideForm(true);
  };

  const handleHideRatingSubmit = async (hideData: HideRatingData) => {
    try {
      if (selectedRating) {
        await hideRating(selectedRating._id, hideData);
        setShowHideForm(false);
        setSelectedRating(null);
      }
    } catch (err) {
      // Error handled in hook
    }
  };

  if (loading && ratings.length === 0) {
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
          <h2 className="text-2xl font-bold">
            {operatorId ? 'Оценки оператора' : 
             user?.role === UserRole.VISITOR ? 'Мои оценки' : 'Управление оценками'}
          </h2>
          {canCreateRatings && showCreateForm && !operatorId && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Оставить оценку
            </button>
          )}
        </div>

        {operatorStats && (
          <RatingsStats operatorStats={operatorStats} />
        )}

        {canViewRatings && !operatorId && (
          <RatingsFilter
            minRating={minRating}
            maxRating={maxRating}
            isVisibleFilter={isVisibleFilter}
            searchQuery={searchQuery}
            onMinRatingChange={setMinRating}
            onMaxRatingChange={setMaxRating}
            onVisibilityFilterChange={setIsVisibleFilter}
            onSearchQueryChange={setSearchQuery}
          />
        )}

        <RatingsList 
          ratings={ratings}
          userRole={user?.role}
          onHideRating={handleHideRating}
        />

        {canViewRatings && totalPages > 1 && (
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

        {showForm && (
          <CreateRatingForm
            operatorId={operatorId}
            loading={loading}
            onSubmit={handleCreateRating}
            onClose={() => setShowForm(false)}
          />
        )}

        {showHideForm && selectedRating && (
          <HideRatingForm
            loading={loading}
            onSubmit={handleHideRatingSubmit}
            onClose={() => setShowHideForm(false)}
          />
        )}
      </div>
    </Suspense>
  );
}