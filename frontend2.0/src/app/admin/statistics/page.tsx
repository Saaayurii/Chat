'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  User,
  Shield,
  AlertTriangle,
  Star,
  Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { usersAPI, statisticsAPI, questionsAPI, ratingsAPI, complaintsAPI } from '@/core/api';
import { User as UserType, UserRole } from '@/types';
import { SearchInput } from '@/components/UI/SearchInput';
import Button from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Select } from '@/components/UI/Select';
import { 
  LineChart, 
  Line, 
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
  Area,
  AreaChart
} from 'recharts';
import { Badge } from '@/components/UI';

// Types for time periods
type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type UserRoleFilter = 'all' | 'admin' | 'operator';

// Color schemes for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminStatisticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('admin');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showOperatorModal, setShowOperatorModal] = useState(false);

  // Calculate date range based on period
  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          dateFrom: yesterday.toISOString(),
          dateTo: today.toISOString()
        };
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          dateFrom: weekAgo.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          dateFrom: monthAgo.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'custom':
        return {
          dateFrom: dateRange.from,
          dateTo: dateRange.to
        };
      default:
        return {};
    }
  };

  const currentDateRange = getDateRange(timePeriod);
  const operatorId = roleFilter === 'operator' ? selectedOperator : undefined;

  // Data fetching queries
  const { data: operators, isLoading: operatorsLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await usersAPI.getOperators();
      return response.data;
    }
  });

  const { data: usersStats, isLoading: usersStatsLoading } = useQuery({
    queryKey: ['users-stats', currentDateRange],
    queryFn: async () => {
      const response = await statisticsAPI.getUsersStats(currentDateRange);
      return response.data;
    }
  });

  const { data: questionsStats, isLoading: questionsStatsLoading } = useQuery({
    queryKey: ['questions-stats', currentDateRange, operatorId],
    queryFn: async () => {
      const response = await statisticsAPI.getQuestionsStats({
        ...currentDateRange,
        operatorId
      });
      return response.data;
    }
  });

  const { data: ratingsStats, isLoading: ratingsStatsLoading } = useQuery({
    queryKey: ['ratings-stats', currentDateRange, operatorId],
    queryFn: async () => {
      const response = await statisticsAPI.getRatingsStats({
        ...currentDateRange,
        operatorId
      });
      return response.data;
    }
  });

  const { data: complaintsStats, isLoading: complaintsStatsLoading } = useQuery({
    queryKey: ['complaints-stats', currentDateRange, operatorId],
    queryFn: async () => {
      const response = await statisticsAPI.getComplaintsStats({
        ...currentDateRange,
        operatorId
      });
      return response.data;
    }
  });

  const { data: selectedOperatorWorkload, isLoading: workloadLoading } = useQuery({
    queryKey: ['operator-workload', selectedOperator],
    queryFn: async () => {
      if (!selectedOperator) return null;
      const response = await statisticsAPI.getOperatorWorkload(selectedOperator);
      return response.data;
    },
    enabled: !!selectedOperator && roleFilter === 'operator'
  });

  // Filter operators
  const filteredOperators = useMemo(() => {
    if (!operators) return [];
    return operators.filter(op => 
      op.profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [operators, searchQuery]);

  const displayedOperators = filteredOperators.slice(0, 8);

  // Get period display name
  const getPeriodDisplayName = (period: TimePeriod) => {
    switch (period) {
      case 'today': return 'Сегодня';
      case 'yesterday': return 'Вчера';
      case 'week': return 'Неделя';
      case 'month': return 'Месяц';
      case 'custom': return 'Период';
      default: return 'Сегодня';
    }
  };

  // Calculate likes/dislikes from ratings
  const likesDislikesData = useMemo(() => {
    if (!ratingsStats?.distribution) return { likes: 0, dislikes: 0 };
    
    const likes = ratingsStats.distribution
      .filter(item => item._id >= 4)
      .reduce((sum, item) => sum + item.count, 0);
    
    const dislikes = ratingsStats.distribution
      .filter(item => item._id <= 2)
      .reduce((sum, item) => sum + item.count, 0);
    
    return { likes, dislikes };
  }, [ratingsStats]);

  // Prepare chart data
  const ratingsDistributionData = ratingsStats?.distribution?.map(item => ({
    name: `${item._id} звезд`,
    count: item.count,
    percentage: ((item.count / ratingsStats.overall.totalRatings) * 100).toFixed(1)
  })) || [];

  const questionsStatusData = useMemo(() => {
    if (!questionsStats?.statusStats) return [];
    
    const totalQuestions = questionsStats.statusStats.reduce((sum, item) => sum + item.count, 0);
    
    return questionsStats.statusStats.map(item => {
      const statusName = item._id === 'open' ? 'Открытые' : 
                        item._id === 'closed' ? 'Закрытые' : 
                        item._id === 'in_progress' ? 'В работе' : 
                        item._id === 'assigned' ? 'Назначенные' : 
                        item._id === 'transferred' ? 'Переданные' : item._id;
                        
      const percentage = totalQuestions > 0 ? ((item.count / totalQuestions) * 100).toFixed(1) : '0';
      
      return {
        name: statusName,
        count: item.count,
        percentage: percentage
      };
    });
  }, [questionsStats]);

  const isLoading = usersStatsLoading || questionsStatsLoading || ratingsStatsLoading || complaintsStatsLoading;

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full xl:w-80 space-y-6">
          {/* Role Toggle */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Статистика по ролям
            </h2>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setRoleFilter('admin');
                  setSelectedOperator(null);
                }}
                variant={roleFilter === 'admin' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <Shield className="w-4 h-4 mr-2" />
                Администратор
              </Button>
              <Button
                onClick={() => setRoleFilter('operator')}
                variant={roleFilter === 'operator' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Оператор
              </Button>
            </div>
          </Card>

          {/* Time Period Filter */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Calendar className="w-5 h-5 inline mr-2" />
              Период времени
            </h2>
            <div className="space-y-2">
              {(['today', 'yesterday', 'week', 'month', 'custom'] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  variant={timePeriod === period ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                >
                  {getPeriodDisplayName(period)}
                </Button>
              ))}
            </div>
            
            {timePeriod === 'custom' && (
              <div className="mt-4 space-y-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
              </div>
            )}
          </Card>

          {/* Operators List */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Операторы
            </h2>
            
            {/* Search */}
            <div className="mb-4">
              <SearchInput
                placeholder="Поиск оператора..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Operators list */}
            <div className="space-y-2">
              <Button
                onClick={() => setSelectedOperator(null)}
                variant={!selectedOperator ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-between"
              >
                <span>Все операторы</span>
                <Badge variant="secondary">
                  {operators?.length || 0}
                </Badge>
              </Button>
              
              {operatorsLoading ? (
                <div className="py-4 text-center text-gray-500">Загрузка...</div>
              ) : (
                displayedOperators.map((operator) => (
                  <Button
                    key={operator._id}
                    onClick={() => setSelectedOperator(operator._id)}
                    variant={selectedOperator === operator._id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full mr-2 ${
                          operator.profile.isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="truncate">
                        {operator.profile.fullName || operator.profile.username}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {operator.operatorStats?.totalQuestions || 0}
                    </Badge>
                  </Button>
                ))
              )}
              
              {filteredOperators.length > 8 && (
                <Button
                  onClick={() => setShowOperatorModal(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Показать всех ({filteredOperators.length - 8} еще)
                </Button>
              )}
            </div>
          </Card>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Статистика
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {roleFilter === 'admin' ? 'Административная панель' : 'Статистика оператора'} • {getPeriodDisplayName(timePeriod)}
                  {selectedOperator && operators && (
                    <span className="ml-2">
                      • {operators.find(op => op._id === selectedOperator)?.profile.fullName || 
                          operators.find(op => op._id === selectedOperator)?.profile.username}
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

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Загрузка статистики...</p>
              </div>
            )}

            {/* Main Statistics Cards */}
            {!isLoading && (
              <>
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
                          {questionsStats?.statusStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
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
                          {questionsStats?.avgResponseTime ? Math.round(questionsStats.avgResponseTime) : 0}
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          минут
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Additional Role-specific Stats */}
                {roleFilter === 'operator' && selectedOperator && selectedOperatorWorkload && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center">
                        <Activity className="w-8 h-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Активные вопросы
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedOperatorWorkload.activeQuestions}
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
                            {selectedOperatorWorkload.totalQuestions}
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
                            {selectedOperatorWorkload.closedToday}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Charts Section */}
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
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                            formatter={(value: any, name: string) => [
                              `${value} (${ratingsDistributionData.find(item => item.count === value)?.percentage}%)`,
                              'Количество'
                            ]}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                            data={operators?.slice(0, 10).map(op => ({
                              name: op.profile.fullName || op.profile.username,
                              questions: op.operatorStats?.totalQuestions || 0,
                              rating: op.operatorStats?.averageRating || 0,
                              responseTime: op.operatorStats?.responseTimeAvg || 0
                            })) || []}
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
                            <Bar dataKey="questions" fill="#3b82f6" name="Вопросы" />
                            <Bar dataKey="rating" fill="#10b981" name="Рейтинг" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {usersStats?.total || 0}
                    </p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Онлайн сейчас</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {usersStats?.online || 0}
                    </p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Средний рейтинг</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {ratingsStats?.overall?.averageRating?.toFixed(1) || '0.0'}
                    </p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Жалобы</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {complaintsStats?.statusStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                    </p>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Operators Modal */}
      {showOperatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-96 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Список операторов
              </h2>
              <Button
                onClick={() => setShowOperatorModal(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-3">
                {filteredOperators.map((operator) => (
                  <div 
                    key={operator._id} 
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      setSelectedOperator(operator._id);
                      setRoleFilter('operator');
                      setShowOperatorModal(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-3 h-3 rounded-full mr-3 ${
                          operator.profile.isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {operator.profile.fullName || operator.profile.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {operator.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {operator.operatorStats?.totalQuestions || 0} вопросов
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {operator.operatorStats?.averageRating?.toFixed(1) || '0.0'} ★
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}