'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, MessageSquare, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { usersAPI } from '@/core/api';
import { User, UserRole } from '@/types';
import { SearchInput } from '@/components/UI/SearchInput';

export default function AdminStatisticsPage() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const {0: searchQuery, 1: setSearchQuery} = useState('');
  const {0: showOperatorModal, 1: setShowOperatorModal} = useState(false);

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-statistics'],
    queryFn: async () => {
      const response = await usersAPI.getUsersStats();
      return response.data;
    }
  });

  const { data: operators, isLoading: operatorsLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await usersAPI.getOperators();
      return response.data;
    }
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredOperators = operators?.filter(op => 
    op.profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const displayedOperators = filteredOperators.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-80">
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Операторы</h2>
              
              {/* Search */}
              <div className="mb-6">
                <SearchInput
                  placeholder="Поиск оператора..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Operators list */}
              <ul className="space-y-2">
                <li>
                  <a href="#" className="block px-3 py-2 text-blue-600 bg-blue-50 rounded-md font-medium">
                    Все операторы
                  </a>
                </li>
                {operatorsLoading ? <li className="px-3 py-2 text-gray-500">Загрузка...</li> : displayedOperators.map((operator) => (
                  <li key={operator._id}>
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <span>{operator.profile.fullName || operator.profile.username}</span>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${operator.profile.isOnline ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                          <span className="text-xs text-gray-500">{operator.operatorStats?.totalQuestions || 0}</span>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
                {filteredOperators.length > 5 ? <li>
                  <button 
                    onClick={() => setShowOperatorModal(true)}
                    className="block w-full px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-left"
                  >
                    Показать всех
                  </button>
                </li> : null}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Статистика</h1>
              
              {statsLoading ? <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Загрузка статистики...</p>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Всего сообщений</p>
                      <p className="text-2xl font-bold text-blue-900">{statistics?.totalMessages || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Всего операторов</p>
                      <p className="text-2xl font-bold text-green-900">{statistics?.totalOperators || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Посетители</p>
                      <p className="text-2xl font-bold text-purple-900">{statistics?.totalVisitors || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600">Онлайн операторы</p>
                      <p className="text-2xl font-bold text-orange-900">{statistics?.onlineOperators || 0}</p>
                    </div>
                  </div>
                </div>
              </div>}
            </div>
          </main>
        </div>

      {/* Operators Modal */}
      {showOperatorModal ? <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-dark-900 rounded-lg max-w-2xl w-full max-h-96 flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Список операторов</h2>
            <button 
              onClick={() => setShowOperatorModal(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {filteredOperators.map((operator) => (
                <div key={operator._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-700 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${operator.profile.isOnline ? 'bg-green-500' : 'bg-gray-300'} mr-3`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">{operator.profile.fullName || operator.profile.username}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{operator.operatorStats?.totalQuestions || 0} вопросов</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> : null}
    </div>
  );
}