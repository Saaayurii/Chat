import { api } from './config';
import type { 
  Rating, 
  CreateRatingData, 
  UpdateRatingVisibilityData, 
  HideRatingData, 
  OperatorRatingStats, 
  RatingStats,
  PaginationParams 
} from '@/types';

export var ratingsAPI = {
  createRating: (data: CreateRatingData) =>
    api.post<Rating>('/ratings', data),

  getRatings: (params?: PaginationParams & {
    operatorId?: string;
    visitorId?: string;
    minRating?: number;
    maxRating?: number;
    isVisible?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ ratings: Rating[]; total: number }>('/ratings', { params }),

  getMyRatings: () =>
    api.get<Rating[]>('/ratings/my'),

  getRatingById: (id: string) =>
    api.get<Rating>(`/ratings/${id}`),

  getOperatorRatings: (operatorId: string, params?: PaginationParams & {
    includeHidden?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    api.get<OperatorRatingStats>(`/ratings/operator/${operatorId}`, { params }),

  getOperatorStats: (operatorId: string) =>
    api.get<{
      averageRating: number;
      totalRatings: number;
      ratingBreakdown: Record<string, number>;
      detailedAverages: {
        avgProfessionalism: number;
        avgResponseTime: number;
        avgHelpfulness: number;
        avgCommunication: number;
        avgProblemResolution: number;
      };
    }>(`/ratings/operator/${operatorId}/stats`),

  hideRating: (id: string, data: HideRatingData) =>
    api.put<Rating>(`/ratings/${id}/hide`, data),

  updateRatingVisibility: (id: string, data: UpdateRatingVisibilityData) =>
    api.put<Rating>(`/ratings/${id}/visibility`, data),

  deleteRating: (id: string) =>
    api.delete(`/ratings/${id}`),

  getRatingStats: () =>
    api.get<RatingStats>('/ratings/stats'),
};