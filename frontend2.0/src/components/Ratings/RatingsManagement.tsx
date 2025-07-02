'use client';

import { useState, useEffect } from 'react';
import { ratingsAPI } from '@/core/api';
import { 
  Rating, 
  CreateRatingData,
  DetailedRating,
  OperatorRatingStats,
  HideRatingData,
  UserRole 
} from '@/types';
import { useAuthStore } from '@/store/authStore';

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
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [operatorStats, setOperatorStats] = useState<OperatorRatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [minRating, setMinRating] = useState<number | ''>('');
  const [maxRating, setMaxRating] = useState<number | ''>('');
  const [isVisibleFilter, setIsVisibleFilter] = useState<boolean | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateRatingData>({
    operatorId: operatorId || '',
    rating: 5,
    comment: '',
    isAnonymous: false,
    detailedRating: {
      professionalism: 5,
      responseTime: 5,
      helpfulness: 5,
      communication: 5,
      problemResolution: 5
    }
  });
  
  // Hide rating form
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [showHideForm, setShowHideForm] = useState(false);
  const [hideData, setHideData] = useState<HideRatingData>({
    hiddenReason: ''
  });

  const canManageRatings = user?.role === UserRole.ADMIN;
  const canCreateRatings = user?.role === UserRole.VISITOR;
  const canViewRatings = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;

  useEffect(() => {
    if (operatorId) {
      loadOperatorRatings();
    } else if (canViewRatings) {
      loadRatings();
    } else if (user?.role === UserRole.VISITOR) {
      loadMyRatings();
    }
  }, [currentPage, minRating, maxRating, isVisibleFilter, searchQuery, operatorId, canViewRatings, user?.role]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        ...(minRating && { minRating: Number(minRating) }),
        ...(maxRating && { maxRating: Number(maxRating) }),
        ...(isVisibleFilter !== '' && { isVisible: Boolean(isVisibleFilter) }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      const response = await ratingsAPI.getRatings(params);
      setRatings(response.data.ratings);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке оценок');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ratingsAPI.getMyRatings();
      setRatings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке моих оценок');
    } finally {
      setLoading(false);
    }
  };

  const loadOperatorRatings = async () => {
    if (!operatorId) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        includeHidden: canManageRatings
      };

      const response = await ratingsAPI.getOperatorRatings(operatorId, params);
      setRatings(response.data.ratings);
      setOperatorStats(response.data);
      
      if (response.data.ratings.length > 0) {
        setTotalPages(Math.ceil(response.data.totalRatings / 10));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке оценок оператора');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateRatings) return;

    try {
      setLoading(true);
      await ratingsAPI.createRating(formData);
      setShowForm(false);
      setFormData({
        operatorId: operatorId || '',
        rating: 5,
        comment: '',
        isAnonymous: false,
        detailedRating: {
          professionalism: 5,
          responseTime: 5,
          helpfulness: 5,
          communication: 5,
          problemResolution: 5
        }
      });
      
      if (operatorId) {
        loadOperatorRatings();
      } else if (user?.role === UserRole.VISITOR) {
        loadMyRatings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании оценки');
    } finally {
      setLoading(false);
    }
  };

  const handleHideRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating || !canManageRatings) return;

    try {
      setLoading(true);
      await ratingsAPI.hideRating(selectedRating._id, hideData);
      setShowHideForm(false);
      setSelectedRating(null);
      setHideData({ hiddenReason: '' });
      
      if (operatorId) {
        loadOperatorRatings();
      } else {
        loadRatings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при скрытии оценки');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={`text-xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getVisibilityColor = (isVisible: boolean) => {
    return isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading && ratings.length === 0) {
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

      {/* Operator Stats */}
      {operatorStats && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Статистика оператора</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{operatorStats.averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Средняя оценка</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{operatorStats.totalRatings}</p>
              <p className="text-sm text-gray-600">Всего оценок</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">
                {operatorStats.detailedAverages.avgProfessionalism.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Профессионализм</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">
                {operatorStats.detailedAverages.avgHelpfulness.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Полезность</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {canViewRatings && !operatorId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
          <input
            type="number"
            min="1"
            max="5"
            placeholder="Мин. оценка"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : '')}
            className="border rounded px-3 py-2"
          />

          <input
            type="number"
            min="1"
            max="5"
            placeholder="Макс. оценка"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value ? Number(e.target.value) : '')}
            className="border rounded px-3 py-2"
          />

          <select
            value={isVisibleFilter.toString()}
            onChange={(e) => setIsVisibleFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            className="border rounded px-3 py-2"
          >
            <option value="">Все оценки</option>
            <option value="true">Видимые</option>
            <option value="false">Скрытые</option>
          </select>

          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <div key={rating._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  {renderStars(rating.rating)}
                  <span className="text-lg font-semibold">{rating.rating}/5</span>
                  {!rating.isVisible && (
                    <span className={`px-2 py-1 rounded text-sm ${getVisibilityColor(rating.isVisible)}`}>
                      Скрыта
                    </span>
                  )}
                  {rating.isAnonymous && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      Анонимно
                    </span>
                  )}
                </div>
                
                {rating.comment && (
                  <p className="text-gray-700 mb-3">{rating.comment}</p>
                )}

                {rating.detailedRating && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div>
                      <p className="font-medium">Профессионализм</p>
                      {renderStars(rating.detailedRating.professionalism)}
                    </div>
                    <div>
                      <p className="font-medium">Время ответа</p>
                      {renderStars(rating.detailedRating.responseTime)}
                    </div>
                    <div>
                      <p className="font-medium">Полезность</p>
                      {renderStars(rating.detailedRating.helpfulness)}
                    </div>
                    <div>
                      <p className="font-medium">Общение</p>
                      {renderStars(rating.detailedRating.communication)}
                    </div>
                    <div>
                      <p className="font-medium">Решение проблем</p>
                      {renderStars(rating.detailedRating.problemResolution)}
                    </div>
                  </div>
                )}

                {rating.hiddenReason && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                    <p className="font-medium text-red-800">Причина скрытия:</p>
                    <p className="text-red-700">{rating.hiddenReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-3">
              <p>Создана: {new Date(rating.createdAt).toLocaleString()}</p>
              {rating.hiddenAt && (
                <p>Скрыта: {new Date(rating.hiddenAt).toLocaleString()}</p>
              )}
            </div>

            {canManageRatings && rating.isVisible && (
              <button
                onClick={() => {
                  setSelectedRating(rating);
                  setShowHideForm(true);
                }}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Скрыть оценку
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
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

      {/* Create Rating Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Оставить оценку оператору</h3>
            <form onSubmit={handleCreateRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID оператора</label>
                <input
                  type="text"
                  placeholder="ID оператора"
                  value={formData.operatorId}
                  onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Общая оценка</label>
                {renderStars(formData.rating, true, (rating) => 
                  setFormData({ ...formData, rating })
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Комментарий</label>
                <textarea
                  placeholder="Ваш отзыв об операторе..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-24"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Детальная оценка:</h4>
                
                <div>
                  <label className="block text-sm mb-1">Профессионализм</label>
                  {renderStars(formData.detailedRating?.professionalism || 5, true, (rating) =>
                    setFormData({
                      ...formData,
                      detailedRating: { ...formData.detailedRating!, professionalism: rating }
                    })
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1">Время ответа</label>
                  {renderStars(formData.detailedRating?.responseTime || 5, true, (rating) =>
                    setFormData({
                      ...formData,
                      detailedRating: { ...formData.detailedRating!, responseTime: rating }
                    })
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1">Полезность</label>
                  {renderStars(formData.detailedRating?.helpfulness || 5, true, (rating) =>
                    setFormData({
                      ...formData,
                      detailedRating: { ...formData.detailedRating!, helpfulness: rating }
                    })
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1">Качество общения</label>
                  {renderStars(formData.detailedRating?.communication || 5, true, (rating) =>
                    setFormData({
                      ...formData,
                      detailedRating: { ...formData.detailedRating!, communication: rating }
                    })
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1">Решение проблем</label>
                  {renderStars(formData.detailedRating?.problemResolution || 5, true, (rating) =>
                    setFormData({
                      ...formData,
                      detailedRating: { ...formData.detailedRating!, problemResolution: rating }
                    })
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                />
                <span>Анонимная оценка</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  {loading ? 'Отправка...' : 'Отправить оценку'}
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

      {/* Hide Rating Form */}
      {showHideForm && selectedRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Скрыть оценку</h3>
            <form onSubmit={handleHideRating} className="space-y-4">
              <textarea
                placeholder="Причина скрытия оценки..."
                value={hideData.hiddenReason}
                onChange={(e) => setHideData({ ...hideData, hiddenReason: e.target.value })}
                className="w-full border rounded px-3 py-2 h-24"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? 'Скрытие...' : 'Скрыть оценку'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHideForm(false)}
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