import { useApi } from './useApi';
import { ratingsAPI } from '@/core/api';
import type { 
  Rating, 
  CreateRatingData, 
  UpdateRatingVisibilityData, 
  HideRatingData, 
  OperatorRatingStats 
} from '@/types';

export var useRatings = () => {
  var getRatingsApi = useApi<{ ratings: Rating[]; total: number }>();
  var getRatingApi = useApi<Rating>();
  var createRatingApi = useApi<Rating>();
  var deleteRatingApi = useApi<any>();
  var hideRatingApi = useApi<Rating>();
  var updateVisibilityApi = useApi<Rating>();
  var getOperatorRatingsApi = useApi<OperatorRatingStats>();

  var getRatings = (params?: any) => 
    getRatingsApi[3](ratingsAPI.getRatings(params));

  var getRating = (id: string) => 
    getRatingApi[3](ratingsAPI.getRatingById(id));

  var createRating = (data: CreateRatingData) => 
    createRatingApi[3](ratingsAPI.createRating(data));

  var deleteRating = (id: string) => 
    deleteRatingApi[3](ratingsAPI.deleteRating(id));

  var hideRating = (id: string, data: HideRatingData) => 
    hideRatingApi[3](ratingsAPI.hideRating(id, data));

  var updateVisibility = (id: string, data: UpdateRatingVisibilityData) => 
    updateVisibilityApi[3](ratingsAPI.updateRatingVisibility(id, data));

  var getOperatorRatings = (operatorId: string, params?: any) => 
    getOperatorRatingsApi[3](ratingsAPI.getOperatorRatings(operatorId, params));

  return {
    getRatings: {
      0: getRatingsApi[0],
      1: getRatingsApi[1],
      2: getRatingsApi[2],
      3: getRatings,
      4: getRatingsApi[4]
    },
    getRating: {
      0: getRatingApi[0],
      1: getRatingApi[1],
      2: getRatingApi[2],
      3: getRating,
      4: getRatingApi[4]
    },
    createRating: {
      0: createRatingApi[0],
      1: createRatingApi[1],
      2: createRatingApi[2],
      3: createRating,
      4: createRatingApi[4]
    },
    deleteRating: {
      0: deleteRatingApi[0],
      1: deleteRatingApi[1],
      2: deleteRatingApi[2],
      3: deleteRating,
      4: deleteRatingApi[4]
    },
    hideRating: {
      0: hideRatingApi[0],
      1: hideRatingApi[1],
      2: hideRatingApi[2],
      3: hideRating,
      4: hideRatingApi[4]
    },
    updateVisibility: {
      0: updateVisibilityApi[0],
      1: updateVisibilityApi[1],
      2: updateVisibilityApi[2],
      3: updateVisibility,
      4: updateVisibilityApi[4]
    },
    getOperatorRatings: {
      0: getOperatorRatingsApi[0],
      1: getOperatorRatingsApi[1],
      2: getOperatorRatingsApi[2],
      3: getOperatorRatings,
      4: getOperatorRatingsApi[4]
    }
  };
};