'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersAPI, statisticsAPI } from '@/core/api';
import { UserRole } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Button from '@/components/UI/Button';
import StatisticsSidebar from '@/components/Statistics/StatisticsSidebar';
import StatisticsCards from '@/components/Statistics/StatisticsCards';
import OperatorStats from '@/components/Statistics/OperatorStats';
import StatisticsCharts from '@/components/Statistics/StatisticsCharts';
import SummaryStats from '@/components/Statistics/SummaryStats';
import OperatorsModal from '@/components/Statistics/OperatorsModal';

type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type UserRoleFilter = 'all' | 'admin' | 'operator';

var AdminStatisticsPageContent = () => {
  var { user } = useAuthStore();

  var [state, setState] = React.useState({
    0: '',
    1: null,
    2: 'today',
    3: 'admin',
    4: { from: '', to: '' },
    5: false
  });

  var getDateRange = (period) => {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        };
      case 'yesterday':
        var yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          dateFrom: yesterday.toISOString(),
          dateTo: today.toISOString(),
        };
      case 'week':
        var weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          dateFrom: weekAgo.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        };
      case 'month':
        var monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          dateFrom: monthAgo.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        };
      case 'custom':
        return {
          dateFrom: state[4].from,
          dateTo: state[4].to,
        };
      default:
        return {};
    }
  };

  var currentDateRange = getDateRange(state[2]);
  var operatorId = state[3] === 'operator' ? state[1] : undefined;

  var { data: operators, isLoading: operatorsLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: () => usersAPI.getOperators().then(response => response.data),
  });

  var { data: usersStats, isLoading: usersStatsLoading } = useQuery({
    queryKey: ['users-stats', currentDateRange],
    queryFn: () => statisticsAPI.getUsersStats(currentDateRange).then(response => response.data),
  });

  var { data: questionsStats, isLoading: questionsStatsLoading } = useQuery({
    queryKey: ['questions-stats', currentDateRange, operatorId],
    queryFn: () => statisticsAPI.getQuestionsStats({
      ...currentDateRange,
      operatorId: operatorId || undefined,
    }).then(response => response.data),
  });

  var { data: ratingsStats, isLoading: ratingsStatsLoading } = useQuery({
    queryKey: ['ratings-stats', currentDateRange, operatorId],
    queryFn: () => statisticsAPI.getRatingsStats({
      ...currentDateRange,
      operatorId: operatorId || undefined,
    }).then(response => response.data),
  });

  var { data: complaintsStats, isLoading: complaintsStatsLoading } = useQuery({
    queryKey: ['complaints-stats', currentDateRange, operatorId],
    queryFn: () => statisticsAPI.getComplaintsStats({
      ...currentDateRange,
      operatorId: operatorId || undefined,
    }).then(response => response.data),
  });

  var { data: selectedOperatorWorkload } = useQuery({
    queryKey: ['operator-workload', state[1]],
    queryFn: () => 
      state[1] 
        ? statisticsAPI.getOperatorWorkload(state[1]).then(response => response.data)
        : Promise.resolve(null),
    enabled: !!state[1] && state[3] === 'operator',
  });

  var getPeriodDisplayName = (period) => {
    switch (period) {
      case 'today': return 'Сегодня';
      case 'yesterday': return 'Вчера';
      case 'week': return 'Неделя';
      case 'month': return 'Месяц';
      case 'custom': return 'Период';
      default: return 'Сегодня';
    }
  };

  var likesDislikesData = React.useMemo(() => {
    return !ratingsStats?.distribution ? { likes: 0, dislikes: 0 } : {
      likes: ratingsStats.distribution
        .filter(item => item._id >= 4)
        .reduce((sum, item) => sum + item.count, 0),
      dislikes: ratingsStats.distribution
        .filter(item => item._id <= 2)
        .reduce((sum, item) => sum + item.count, 0)
    };
  }, [ratingsStats]);

  var ratingsDistributionData = ratingsStats?.distribution?.map(item => ({
    name: `${item._id} звезд`,
    count: item.count,
    percentage: (
      (item.count / ratingsStats.overall.totalRatings) * 100
    ).toFixed(1),
  })) || [];

  var questionsStatusData = React.useMemo(() => {
    return !questionsStats?.statusStats ? [] : (() => {
      var totalQuestions = questionsStats.statusStats.reduce(
        (sum, item) => sum + item.count,
        0
      );

      return questionsStats.statusStats.map(item => {
        var statusName = 
          item._id === 'open' ? 'Открытые' :
          item._id === 'closed' ? 'Закрытые' :
          item._id === 'in_progress' ? 'В работе' :
          item._id === 'assigned' ? 'Назначенные' :
          item._id === 'transferred' ? 'Переданные' :
          item._id;

        var percentage = totalQuestions > 0
          ? ((item.count / totalQuestions) * 100).toFixed(1)
          : '0';

        return {
          name: statusName,
          count: item.count,
          percentage: percentage,
        };
      });
    })();
  }, [questionsStats]);

  var isLoading = usersStatsLoading || questionsStatsLoading || ratingsStatsLoading || complaintsStatsLoading;

  return isLoading && !questionsStats ? (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500">Загрузка статистики...</p>
    </div>
  ) : (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col xl:flex-row gap-8">
        <StatisticsSidebar
          roleFilter={state[3]}
          onRoleFilterChange={(role) => setState(prev => ({ ...prev, 3: role }))}
          selectedOperator={state[1]}
          onOperatorSelect={(operatorId) => setState(prev => ({ ...prev, 1: operatorId }))}
          timePeriod={state[2]}
          onTimePeriodChange={(period) => setState(prev => ({ ...prev, 2: period }))}
          dateRange={state[4]}
          onDateRangeChange={(range) => setState(prev => ({ ...prev, 4: range }))}
          searchQuery={state[0]}
          onSearchQueryChange={(query) => setState(prev => ({ ...prev, 0: query }))}
          operators={operators}
          operatorsLoading={operatorsLoading}
          onShowModal={() => setState(prev => ({ ...prev, 5: true }))}
        />

        <main className="flex-1">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Статистика
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {state[3] === 'admin' ? 'Административная панель' : 'Статистика оператора'} • {getPeriodDisplayName(state[2])}
                  {state[1] && operators && (
                    <span className="ml-2">
                      • {operators.find(op => op._id === state[1])?.profile.fullName ||
                          operators.find(op => op._id === state[1])?.profile.username}
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="shrink-0"
              >
                <Activity className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </div>

            {!isLoading && (
              <>
                <StatisticsCards
                  questionsStats={questionsStats}
                  likesDislikesData={likesDislikesData}
                />

                {state[3] === 'operator' && state[1] && selectedOperatorWorkload && (
                  <OperatorStats workload={selectedOperatorWorkload} />
                )}

                <StatisticsCharts
                  questionsStatusData={questionsStatusData}
                  ratingsDistributionData={ratingsDistributionData}
                  operators={operators}
                  roleFilter={state[3]}
                />

                <SummaryStats
                  usersStats={usersStats}
                  ratingsStats={ratingsStats}
                  complaintsStats={complaintsStats}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <OperatorsModal
        open={state[5]}
        onClose={() => setState(prev => ({ ...prev, 5: false }))}
        operators={operators?.filter(op =>
          op.profile.fullName?.toLowerCase().includes(state[0].toLowerCase()) ||
          op.profile.username.toLowerCase().includes(state[0].toLowerCase())
        ) || []}
        onOperatorSelect={(operatorId) => setState(prev => ({ ...prev, 1: operatorId }))}
        onRoleFilterChange={(role) => setState(prev => ({ ...prev, 3: role }))}
      />
    </div>
  );
};

export default () => (
  <ProtectedRoute requiredRole={UserRole.ADMIN}>
    <AdminStatisticsPageContent />
  </ProtectedRoute>
);