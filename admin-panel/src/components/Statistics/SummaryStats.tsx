'use client';

import { Users, Activity, Star, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/UI/Card';

interface SummaryStatsProps {
  usersStats?: {
    total: number;
    online: number;
  };
  ratingsStats?: {
    overall?: {
      averageRating: number;
    };
  };
  complaintsStats?: {
    statusStats?: Array<{
      count: number;
    }>;
  };
}

export default ({ usersStats, ratingsStats, complaintsStats }: SummaryStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="p-4 text-center">
      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Всего пользователей
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {usersStats?.total || 0}
      </p>
    </Card>

    <Card className="p-4 text-center">
      <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Онлайн сейчас
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {usersStats?.online || 0}
      </p>
    </Card>

    <Card className="p-4 text-center">
      <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Средний рейтинг
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {ratingsStats?.overall?.averageRating?.toFixed(1) || '0.0'}
      </p>
    </Card>

    <Card className="p-4 text-center">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Жалобы
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {complaintsStats?.statusStats?.reduce(
          (sum, stat) => sum + stat.count,
          0
        ) || 0}
      </p>
    </Card>
  </div>
);