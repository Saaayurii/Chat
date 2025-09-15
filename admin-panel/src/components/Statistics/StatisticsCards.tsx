'use client';

import { MessageSquare, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Card } from '@/components/UI/Card';

interface StatisticsCardsProps {
  questionsStats: any;
  likesDislikesData: { likes: number; dislikes: number };
}

export default ({ questionsStats, likesDislikesData }: StatisticsCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Dialogs/Conversations */}
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
      <div className="flex items-center">
        <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        <div className="ml-4">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Диалогов
          </p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {questionsStats?.statusStats?.reduce(
              (sum: number, stat: any) => sum + stat.count,
              0
            ) || 0}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Всего вопросов
          </p>
        </div>
      </div>
    </Card>

    {/* Likes */}
    <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
      <div className="flex items-center">
        <ThumbsUp className="w-10 h-10 text-green-600 dark:text-green-400" />
        <div className="ml-4">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Лайков
          </p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">
            {likesDislikesData.likes}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Оценки 4-5 звезд
          </p>
        </div>
      </div>
    </Card>

    {/* Dislikes */}
    <Card className="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
      <div className="flex items-center">
        <ThumbsDown className="w-10 h-10 text-red-600 dark:text-red-400" />
        <div className="ml-4">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Дизлайков
          </p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">
            {likesDislikesData.dislikes}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            Оценки 1-2 звезды
          </p>
        </div>
      </div>
    </Card>

    {/* Average Response Time */}
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
      <div className="flex items-center">
        <Clock className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        <div className="ml-4">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Среднее время ответа
          </p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {questionsStats?.avgResponseTime
              ? Math.round(questionsStats.avgResponseTime)
              : 0}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            минут
          </p>
        </div>
      </div>
    </Card>
  </div>
);