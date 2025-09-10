"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Badge } from "@/components/UI";

interface DailyStat {
  date: string;
  conversations: number;
  messages: number;
  avgResponseTime: number;
}

interface HourlyDistribution {
  hour: number;
  count: number;
}

interface ChartsSectionProps {
  dailyStats: DailyStat[] | undefined;
  hourlyDistribution: HourlyDistribution[] | undefined;
  getMaxHourlyCount: () => number;
}

var ChartsSection = ({ dailyStats, hourlyDistribution, getMaxHourlyCount }: ChartsSectionProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <Card>
      <CardHeader>
        <CardTitle>Активность по дням</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dailyStats?.map((day) => (
            <div key={day.date} className="flex items-center justify-between">
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

    <Card>
      <CardHeader>
        <CardTitle>Распределение по часам</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hourlyDistribution?.map((hour) => (
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
);

export default ChartsSection;