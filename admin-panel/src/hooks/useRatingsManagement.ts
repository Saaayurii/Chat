'use client';

import { useState, useEffect } from 'react';
import { ratingsAPI } from '@/core/api';
import { 
  Rating, 
  CreateRatingData,
  OperatorRatingStats,
  HideRatingData,
  UserRole 
} from '@/types';

interface UseRatingsManagementProps {
  operatorId?: string;
  userRole?: UserRole;
}

export const useRatingsManagement = ({ operatorId, userRole }: UseRatingsManagementProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [operatorStats, setOperatorStats] = useState<OperatorRatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [minRating, setMinRating] = useState<number | ''>('');
  const [maxRating, setMaxRating] = useState<number | ''>('');
  const [isVisibleFilter, setIsVisibleFilter] = useState<boolean | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const canManageRatings = userRole === UserRole.ADMIN;
  const canViewRatings = userRole === UserRole.ADMIN || userRole === UserRole.OPERATOR;

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

  const createRating = async (formData: CreateRatingData) => {
    try {
      setLoading(true);
      await ratingsAPI.createRating(formData);
      
      if (operatorId) {
        loadOperatorRatings();
      } else if (userRole === UserRole.VISITOR) {
        loadMyRatings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании оценки');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hideRating = async (ratingId: string, hideData: HideRatingData) => {
    try {
      setLoading(true);
      await ratingsAPI.hideRating(ratingId, hideData);
      
      if (operatorId) {
        loadOperatorRatings();
      } else {
        loadRatings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при скрытии оценки');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (operatorId) {
      loadOperatorRatings();
    } else if (canViewRatings) {
      loadRatings();
    } else if (userRole === UserRole.VISITOR) {
      loadMyRatings();
    }
  }, [currentPage, minRating, maxRating, isVisibleFilter, searchQuery, operatorId, canViewRatings, userRole]);

  return {
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
    hideRating,
    loadRatings,
    loadMyRatings,
    loadOperatorRatings
  };
};