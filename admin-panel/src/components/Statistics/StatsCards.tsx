"use client";

import { MessageSquare, Clock, Star, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";

interface OperatorStats {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  averageRating: number;
  totalRatings: number;
}

interface StatsCardsProps {
  stats: OperatorStats | undefined;
  formatTime: (seconds: number) => string;
}

var StatsCards = ({ stats, formatTime }: StatsCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Всего диалогов</CardTitle>
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats?.totalConversations}</div>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-600 font-medium">+12%</span> от прошлой недели
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Отправлено сообщений</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats?.totalMessages}</div>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-600 font-medium">+8%</span> от прошлой недели
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Среднее время ответа</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatTime(stats?.averageResponseTime || 0)}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-red-600 font-medium">+5%</span> от прошлой недели
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Средняя оценка</CardTitle>
        <Star className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center">
          {stats?.averageRating}
          <Star className="h-5 w-5 text-yellow-500 ml-1" fill="currentColor" />
        </div>
        <p className="text-xs text-muted-foreground">
          Из {stats?.totalRatings} оценок
        </p>
      </CardContent>
    </Card>
  </div>
);

export default StatsCards;