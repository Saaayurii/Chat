'use client';

import { Rating } from '@/types';
import StarRating from './StarRating';

interface RatingCardProps {
  rating: Rating;
  canManageRatings: boolean;
  onHideRating: (rating: Rating) => void;
}

export default function RatingCard({ rating, canManageRatings, onHideRating }: RatingCardProps) {
  const getVisibilityColor = (isVisible: boolean) => {
    return isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <StarRating rating={rating.rating} />
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
                <StarRating rating={rating.detailedRating.professionalism} />
              </div>
              <div>
                <p className="font-medium">Время ответа</p>
                <StarRating rating={rating.detailedRating.responseTime} />
              </div>
              <div>
                <p className="font-medium">Полезность</p>
                <StarRating rating={rating.detailedRating.helpfulness} />
              </div>
              <div>
                <p className="font-medium">Общение</p>
                <StarRating rating={rating.detailedRating.communication} />
              </div>
              <div>
                <p className="font-medium">Решение проблем</p>
                <StarRating rating={rating.detailedRating.problemResolution} />
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
          onClick={() => onHideRating(rating)}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Скрыть оценку
        </button>
      )}
    </div>
  );
}