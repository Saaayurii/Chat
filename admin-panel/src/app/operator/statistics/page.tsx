"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  MessageSquare,
  Clock,
  Star,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Badge, Loading } from "@/components/UI";
import Button from "@/components/UI/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/Select";

// Типы для статистики
interface OperatorStats {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  averageRating: number;
  totalRatings: number;
  dailyStats: {
    date: string;
    conversations: number;
    messages: number;
    avgResponseTime: number;
  }[];
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

// Моковые данные для демонстрации
const mockOperatorStats: OperatorStats = {
  totalConversations: 156,
  totalMessages: 892,
  averageResponseTime: 125, // в секундах
  averageRating: 4.3,
  totalRatings: 89,
  dailyStats: [
    {
      date: "2024-01-15",
      conversations: 12,
      messages: 45,
      avgResponseTime: 120,
    },
    {
      date: "2024-01-16",
      conversations: 15,
      messages: 52,
      avgResponseTime: 110,
    },
    {
      date: "2024-01-17",
      conversations: 18,
      messages: 67,
      avgResponseTime: 105,
    },
    {
      date: "2024-01-18",
      conversations: 22,
      messages: 78,
      avgResponseTime: 130,
    },
    {
      date: "2024-01-19",
      conversations: 19,
      messages: 64,
      avgResponseTime: 115,
    },
    {
      date: "2024-01-20",
      conversations: 25,
      messages: 89,
      avgResponseTime: 125,
    },
    {
      date: "2024-01-21",
      conversations: 20,
      messages: 71,
      avgResponseTime: 140,
    },
  ],
  hourlyDistribution: [
    { hour: 9, count: 15 },
    { hour: 10, count: 25 },
    { hour: 11, count: 35 },
    { hour: 12, count: 20 },
    { hour: 13, count: 10 },
    { hour: 14, count: 30 },
    { hour: 15, count: 40 },
    { hour: 16, count: 45 },
    { hour: 17, count: 35 },
    { hour: 18, count: 25 },
  ],
  ratingDistribution: [
    { rating: 1, count: 2 },
    { rating: 2, count: 5 },
    { rating: 3, count: 12 },
    { rating: 4, count: 35 },
    { rating: 5, count: 35 },
  ],
};

export default function OperatorStatisticsPage() {
  const { user } = useAuthStore();
  const { 0: selectedPeriod, 1: setSelectedPeriod } = useState("week");
  const { 0: mounted, 1: setMounted } = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // В реальном приложении здесь был бы API запрос
  const { data: stats, isLoading } = useQuery({
    queryKey: ["operator-stats", user?.id, selectedPeriod],
    queryFn: async () => {
      // Симуляция API запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockOperatorStats;
    },
    enabled: !!user?.id,
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  const getMaxHourlyCount = () => {
    if (!stats) return 0;
    return Math.max(...stats.hourlyDistribution.map((h) => h.count));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loading className="mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Моя статистика
              </h1>
              <p className="text-muted-foreground mt-1">
                Статистика работы оператора{" "}
                {user?.profile?.fullName || user?.profile?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {mounted && (
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Выберите период" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Сегодня</SelectItem>
                    <SelectItem value="yesterday">Вчера</SelectItem>
                    <SelectItem value="week">Неделя</SelectItem>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="custom">Период</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего диалогов
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalConversations}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">+12%</span> от
                прошлой недели
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Отправлено сообщений
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">+8%</span> от
                прошлой недели
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Среднее время ответа
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(stats?.averageResponseTime || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600 font-medium">+5%</span> от прошлой
                недели
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Средняя оценка
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {stats?.averageRating}
                <Star
                  className="h-5 w-5 text-yellow-500 ml-1"
                  fill="currentColor"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Из {stats?.totalRatings} оценок
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Активность по дням</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.dailyStats.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(day.date).toLocaleDateString("ru-RU", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {day.conversations} диалогов
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.messages} сообщений
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Распределение по часам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.hourlyDistribution.map((hour) => (
                  <div key={hour.hour} className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-foreground w-12">
                      {hour.hour}:00
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 relative">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(hour.count / getMaxHourlyCount()) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground w-8">
                      {hour.count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение оценок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {stats?.ratingDistribution.map((rating) => (
                <div key={rating.rating} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-lg font-bold">{rating.rating}</span>
                    <Star
                      className="h-4 w-4 text-yellow-500 ml-1"
                      fill="currentColor"
                    />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {rating.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(
                      (rating.count / (stats?.totalRatings || 1)) * 100
                    )}
                    %
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
