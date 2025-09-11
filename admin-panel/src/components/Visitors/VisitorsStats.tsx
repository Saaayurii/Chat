'use client';

import { User, Ban, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';

interface VisitorsStatsProps {
  visitorsData?: {
    total: number;
    data?: Array<{
      isActivated: boolean;
      isBlocked: boolean;
      profile?: {
        isOnline?: boolean;
      };
    }>;
  };
}

export default ({ visitorsData }: VisitorsStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Всего посетителей
        </CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{visitorsData?.total || 0}</div>
        <p className="text-xs text-muted-foreground">
          {visitorsData?.data?.filter(v => v.profile?.isOnline).length || 0} в сети
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Авторизованные
        </CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {visitorsData?.data?.filter(v => v.isActivated).length || 0}
        </div>
        <p className="text-xs text-muted-foreground">
          Подтвержденные аккаунты
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Заблокированные
        </CardTitle>
        <Ban className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">
          {visitorsData?.data?.filter(v => v.isBlocked).length || 0}
        </div>
        <p className="text-xs text-muted-foreground">
          Заблокированные пользователи
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Активные чаты</CardTitle>
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">{0}</div>
        <p className="text-xs text-muted-foreground">Ведут диалоги</p>
      </CardContent>
    </Card>
  </div>
);