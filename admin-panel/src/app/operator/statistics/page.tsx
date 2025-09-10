"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Loading } from "@/components/UI";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/Select";
import StatsCards from "@/components/Statistics/StatsCards";
import ChartsSection from "@/components/Statistics/ChartsSection";
import RatingDistribution from "@/components/Statistics/RatingDistribution";
import useOperatorStatistics from "@/hooks/useOperatorStatistics";

var OperatorStatisticsPage = () => {
  var { user } = useAuthStore();
  var { 0: selectedPeriod, 1: setSelectedPeriod } = useState("week");
  var { 0: mounted, 1: setMounted } = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  var { stats, isLoading, formatTime, getMaxHourlyCount } = useOperatorStatistics(
    user?.id,
    selectedPeriod
  );

  return isLoading ? (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loading className="mx-auto mb-4" />
        <p className="text-muted-foreground">Загрузка статистики...</p>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Моя статистика</h1>
              <p className="text-muted-foreground mt-1">
                Статистика работы оператора{" "}
                {user?.profile?.fullName || user?.profile?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {mounted && (
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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

        <StatsCards stats={stats} formatTime={formatTime} />
        <ChartsSection
          dailyStats={stats?.dailyStats}
          hourlyDistribution={stats?.hourlyDistribution}
          getMaxHourlyCount={getMaxHourlyCount}
        />
        <RatingDistribution
          ratingDistribution={stats?.ratingDistribution}
          totalRatings={stats?.totalRatings}
        />
      </div>
    </div>
  );
};

export default OperatorStatisticsPage;