'use client';

import { Activity, TrendingUp, Star } from 'lucide-react';
import { Card } from '@/components/UI/Card';

interface OperatorStatsProps {
  workload: {
    activeQuestions: number;
    totalQuestions: number;
    closedToday: number;
  };
}

export default ({ workload }: OperatorStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card className="p-6">
      <div className="flex items-center">
        <Activity className="w-8 h-8 text-orange-600" />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Активные вопросы
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {workload.activeQuestions}
          </p>
        </div>
      </div>
    </Card>

    <Card className="p-6">
      <div className="flex items-center">
        <TrendingUp className="w-8 h-8 text-blue-600" />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Всего вопросов
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {workload.totalQuestions}
          </p>
        </div>
      </div>
    </Card>

    <Card className="p-6">
      <div className="flex items-center">
        <Star className="w-8 h-8 text-green-600" />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Закрыто сегодня
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {workload.closedToday}
          </p>
        </div>
      </div>
    </Card>
  </div>
);