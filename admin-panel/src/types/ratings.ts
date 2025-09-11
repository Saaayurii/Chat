export interface DetailedRating {
  professionalism: number;
  responseTime: number;
  helpfulness: number;
  communication: number;
  problemResolution: number;
}

export interface Rating {
  _id: string;
  operatorId: string;
  visitorId: string;
  rating: number;
  comment?: string;
  relatedQuestionId?: string;
  relatedConversationId?: string;
  detailedRating?: DetailedRating;
  isAnonymous: boolean;
  isVisible: boolean;
  hiddenBy?: string;
  hiddenReason?: string;
  hiddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRatingData {
  operatorId: string;
  rating: number;
  comment?: string;
  relatedQuestionId?: string;
  relatedConversationId?: string;
  detailedRating?: DetailedRating;
  isAnonymous?: boolean;
}

export interface UpdateRatingVisibilityData {
  isVisible: boolean;
  hiddenReason?: string;
}

export interface HideRatingData {
  hiddenReason: string;
}

export interface OperatorRatingStats {
  ratings: Rating[];
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
}

export interface RatingStats {
  overall: {
    totalRatings: number;
    averageRating: number;
    minRating: number;
    maxRating: number;
  };
  distribution: Array<{ _id: number; count: number }>;
  topOperators: Array<{
    _id: string;
    averageRating: number;
    totalRatings: number;
    operator: any;
  }>;
}