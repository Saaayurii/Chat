'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, Shield, ShieldOff, Eye, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/core/api';
import { User, UserRole } from '@/types';
import * as Radix from '@radix-ui/themes';
import CreateUserModal from '@/components/Users/CreateUserModal';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Сбрасываем страницу при новом поиске
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, selectedRole, debouncedSearchQuery],
    queryFn: async () => {
      const response = await usersAPI.getUsers({
        page,
        limit: 20,
        role: selectedRole || undefined,
        search: debouncedSearchQuery || undefined
      });
      return response.data;
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.toggleUserBlock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => 
      usersAPI.deleteUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleBlockUser = (userId: string) => {
    confirm('Вы уверены, что хотите изменить статус блокировки пользователя?') ? blockUserMutation.mutate(userId) : null;
  };

  const handleDeleteUser = (userId: string) => {
    const reason = prompt('Укажите причину удаления:');
    reason ? deleteUserMutation.mutate({ userId, reason }) : null;
  };

  const getRoleColor = (role: UserRole) => {
    return role === UserRole.ADMIN ? 'red' : role === UserRole.OPERATOR ? 'blue' : 'gray';
  };

  const getRoleLabel = (role: UserRole) => {
    return role === UserRole.ADMIN ? 'Администратор' : role === UserRole.OPERATOR ? 'Оператор' : role === UserRole.VISITOR ? 'Посетитель' : role;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Управление пользователями</h1>
              <p className="text-muted-foreground">Управляйте пользователями системы</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Добавить пользователя
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Поиск
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по email или имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Роль
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | '')}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="">Все роли</option>
                <option value={UserRole.ADMIN}>Администратор</option>
                <option value={UserRole.OPERATOR}>Оператор</option>
                <option value={UserRole.VISITOR}>Посетитель</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('');
                  setPage(1);
                }}
                className="px-4 py-2 border border-input rounded-lg hover:bg-accent"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Radix.Spinner />
                      <span className="ml-2">Загрузка пользователей...</span>
                    </td>
                  </tr>
                ) : !usersData?.data || usersData.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Пользователи не найдены
                    </td>
                  </tr>
                ) : (
                  usersData.data.map((user) => (
                    <tr key={user._id} className="hover:bg-accent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            {user.profile.avatarUrl ? <img
                              src={user.profile.avatarUrl}
                              alt={user.profile.fullName || user.profile.username}
                              className="w-10 h-10 rounded-full"
                            /> : <span className="text-muted-foreground font-medium">
                              {((user.profile.fullName || user.profile.username) ?? '').charAt(0).toUpperCase()}
                            </span>}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.profile.fullName || user.profile.username}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Radix.Badge color={getRoleColor(user.role) as any} variant="soft">
                          {getRoleLabel(user.role)}
                        </Radix.Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Radix.Badge 
                            color={user.isActivated ? 'green' : 'orange'} 
                            variant="soft"
                          >
                            {user.isActivated ? 'Активирован' : 'Не активирован'}
                          </Radix.Badge>
                          {user.isBlocked ? <Radix.Badge color="red" variant="soft">
                            Заблокирован
                          </Radix.Badge> : null}
                          {user.profile.isOnline ? <Radix.Badge color="green" variant="soft">
                            Онлайн
                          </Radix.Badge> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleBlockUser(user._id)}
                            className={`p-2 rounded-lg ${user.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                            title={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                          >
                            {user.isBlocked ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                          </button>
                          
                          {!user.isActivated ? <button
                            onClick={() => activateUserMutation.mutate(user._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Активировать"
                          >
                            <Eye className="w-4 h-4" />
                          </button> : null}
                          
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usersData && usersData.totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-border bg-card">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent disabled:opacity-50"
                >
                  Предыдущая
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === usersData.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent disabled:opacity-50"
                >
                  Следующая
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    Показано <span className="font-medium">{((page - 1) * 20) + 1}</span> до{' '}
                    <span className="font-medium">
                      {Math.min(page * 20, usersData.total)}
                    </span>{' '}
                    из <span className="font-medium">{usersData.total}</span> результатов
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                    >
                      Предыдущая
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === usersData.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                    >
                      Следующая
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Create User Modal */}
        <CreateUserModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </div>
  );
}