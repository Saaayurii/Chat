'use client';

import { OperatorRatingStats } from '@/types';

interface RatingsStatsProps {
  operatorStats: OperatorRatingStats;
}

export default function RatingsStats({ operatorStats }: RatingsStatsProps) {
  return (
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
  );
}