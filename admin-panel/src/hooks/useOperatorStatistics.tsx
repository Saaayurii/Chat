"use client";

import { useQuery } from "@tanstack/react-query";

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

var mockOperatorStats: OperatorStats = {
  totalConversations: 156,
  totalMessages: 892,
  averageResponseTime: 125,
  averageRating: 4.3,
  totalRatings: 89,
  dailyStats: [
    { date: "2024-01-15", conversations: 12, messages: 45, avgResponseTime: 120 },
    { date: "2024-01-16", conversations: 15, messages: 52, avgResponseTime: 110 },
    { date: "2024-01-17", conversations: 18, messages: 67, avgResponseTime: 105 },
    { date: "2024-01-18", conversations: 22, messages: 78, avgResponseTime: 130 },
    { date: "2024-01-19", conversations: 19, messages: 64, avgResponseTime: 115 },
    { date: "2024-01-20", conversations: 25, messages: 89, avgResponseTime: 125 },
    { date: "2024-01-21", conversations: 20, messages: 71, avgResponseTime: 140 },
  ],
  hourlyDistribution: [
    { hour: 9, count: 15 }, { hour: 10, count: 25 }, { hour: 11, count: 35 },
    { hour: 12, count: 20 }, { hour: 13, count: 10 }, { hour: 14, count: 30 },
    { hour: 15, count: 40 }, { hour: 16, count: 45 }, { hour: 17, count: 35 },
    { hour: 18, count: 25 },
  ],
  ratingDistribution: [
    { rating: 1, count: 2 }, { rating: 2, count: 5 }, { rating: 3, count: 12 },
    { rating: 4, count: 35 }, { rating: 5, count: 35 },
  ],
};

var useOperatorStatistics = (userId: string | undefined, selectedPeriod: string) => {
  var { data: stats, isLoading } = useQuery({
    queryKey: ["operator-stats", userId, selectedPeriod],
    queryFn: () => {
      return new Promise<OperatorStats>((resolve) => 
        setTimeout(() => resolve(mockOperatorStats), 1000)
      );
    },
    enabled: !!userId,
  });

  var formatTime = (seconds: number) => {
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  var getMaxHourlyCount = () => {
    return !stats ? 0 : Math.max(...stats.hourlyDistribution.map((h) => h.count));
  };

  return {
    stats,
    isLoading,
    formatTime,
    getMaxHourlyCount,
  };
};

export default useOperatorStatistics;