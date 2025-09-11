'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '@/components/UI/Card';

var COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

interface StatisticsChartsProps {
  questionsStatusData: Array<{
    name: string;
    count: number;
    percentage: string;
  }>;
  ratingsDistributionData: Array<{
    name: string;
    count: number;
    percentage: string;
  }>;
  operators?: Array<{
    _id: string;
    profile: {
      fullName?: string;
      username: string;
    };
    operatorStats?: {
      totalQuestions: number;
      averageRating: number;
      responseTimeAvg: number;
    };
  }>;
  roleFilter: string;
}

export default ({ 
  questionsStatusData, 
  ratingsDistributionData, 
  operators, 
  roleFilter 
}: StatisticsChartsProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Questions Status Distribution */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Статус вопросов
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={questionsStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {questionsStatusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Ratings Distribution */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Распределение оценок
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ratingsDistributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#6b7280" />
            <Tooltip
              formatter={(value) => [
                `${value} (${
                  ratingsDistributionData.find(
                    (item) => item.count === value
                  )?.percentage
                }%)`,
                'Количество',
              ]}
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Top Operators Performance */}
    {roleFilter === 'admin' && (
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Производительность операторов
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={
                operators?.slice(0, 10).map(op => ({
                  name: op.profile.fullName || op.profile.username,
                  questions: op.operatorStats?.totalQuestions || 0,
                  rating: op.operatorStats?.averageRating || 0,
                  responseTime: op.operatorStats?.responseTimeAvg || 0,
                })) || []
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="questions"
                fill="#3b82f6"
                name="Вопросы"
              />
              <Bar
                dataKey="rating"
                fill="#10b981"
                name="Рейтинг"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    )}
  </div>
);