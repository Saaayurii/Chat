'use client';

import { Shield, User, Calendar } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import { Badge } from '@/components/UI';
import { SearchInput } from '@/components/UI/SearchInput';
import { User as UserType } from '@/types';

type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type UserRoleFilter = 'all' | 'admin' | 'operator';

interface StatisticsSidebarProps {
  roleFilter: UserRoleFilter;
  onRoleFilterChange: (role: UserRoleFilter) => void;
  selectedOperator: string | null;
  onOperatorSelect: (operatorId: string | null) => void;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  operators: UserType[] | undefined;
  operatorsLoading: boolean;
  onShowModal: () => void;
}

var getPeriodDisplayName = (period: TimePeriod) => {
  switch (period) {
    case 'today': return 'Сегодня';
    case 'yesterday': return 'Вчера';
    case 'week': return 'Неделя';
    case 'month': return 'Месяц';
    case 'custom': return 'Период';
    default: return 'Сегодня';
  }
};

export default ({
  roleFilter,
  onRoleFilterChange,
  selectedOperator,
  onOperatorSelect,
  timePeriod,
  onTimePeriodChange,
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchQueryChange,
  operators,
  operatorsLoading,
  onShowModal
}: StatisticsSidebarProps) => {
  var filteredOperators = operators?.filter(op =>
    op.profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  var displayedOperators = filteredOperators.slice(0, 8);

  return (
    <aside className="w-full xl:w-80 space-y-6">
      {/* Role Toggle */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Статистика по ролям
        </h2>
        <div className="space-y-3">
          <Button
            onClick={() => {
              onRoleFilterChange('admin');
              onOperatorSelect(null);
            }}
            variant={roleFilter === 'admin' ? 'default' : 'outline'}
            className="w-full justify-start"
          >
            <Shield className="w-4 h-4 mr-2" />
            Администратор
          </Button>
          <Button
            onClick={() => onRoleFilterChange('operator')}
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
          {(['today', 'yesterday', 'week', 'month', 'custom'] as TimePeriod[]).map(period => (
            <Button
              key={period}
              onClick={() => onTimePeriodChange(period)}
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
              onChange={e => onDateRangeChange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            />
            <input
              type="date"
              value={dateRange.to}
              onChange={e => onDateRangeChange({ ...dateRange, to: e.target.value })}
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

        <div className="mb-4">
          <SearchInput
            placeholder="Поиск оператора..."
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => onOperatorSelect(null)}
            variant={!selectedOperator ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-between"
          >
            <span>Все операторы</span>
            <Badge variant="secondary">{operators?.length || 0}</Badge>
          </Button>

          {operatorsLoading ? (
            <div className="py-4 text-center text-gray-500">Загрузка...</div>
          ) : (
            displayedOperators.map(operator => (
              <Button
                key={operator._id}
                onClick={() => onOperatorSelect(operator._id)}
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
              onClick={onShowModal}
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
  );
};