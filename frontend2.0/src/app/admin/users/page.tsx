'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldOff, 
  Eye, 
  UserPlus, 
  Users,
  Mail,
  Phone,
  User,
  Lock,
  Activity,
  Star,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersAPI, CreateUserData, ratingsAPI, questionsAPI } from '@/core/api';
import { User as UserType, UserRole } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';

// Shadcn UI Components
import Button from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Label } from '@/components/UI/Label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/Select';
import Pagination from '@/components/UI/Pagination';
import { Avatar } from '@/components/UI/Avatar';
import { Badge, Loading } from '@/components/UI';

interface FormData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  bio: string;
  role: UserRole;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  role?: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useNotifications();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    fullName: '',
    phone: '',
    bio: '',
    role: UserRole.OPERATOR
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Data fetching queries
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, selectedRole, debouncedSearchQuery],
    queryFn: async () => {
      const response = await usersAPI.getUsers({
        page,
        limit: 10,
        role: selectedRole || undefined,
        search: debouncedSearchQuery || undefined
      });
      return response.data;
    }
  });

  // Get operator performance data for selected user
  const { data: operatorStats } = useQuery({
    queryKey: ['operator-stats', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const [ratingsRes, workloadRes] = await Promise.all([
        ratingsAPI.getOperatorStats(selectedUserId).catch(() => null),
        questionsAPI.getOperatorWorkload(selectedUserId).catch(() => null)
      ]);
      return {
        ratings: ratingsRes?.data,
        workload: workloadRes?.data
      };
    },
    enabled: !!selectedUserId
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Сотрудник успешно добавлен');
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при создании сотрудника';
      showError(errorMessage);
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.toggleUserBlock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Статус блокировки изменен');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => 
      usersAPI.deleteUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Сотрудник удален');
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Пользователь активирован');
    }
  });

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email адрес';
    }

    if (!formData.username) {
      newErrors.username = 'Логин обязателен';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Логин должен содержать минимум 3 символа';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'ФИО обязательно';
    }

    if (formData.phone && !/^\+7\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона в формате +7XXXXXXXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      fullName: '',
      phone: '',
      bio: '',
      role: UserRole.OPERATOR
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: CreateUserData = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      role: formData.role
    };

    createUserMutation.mutate(submitData);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlockUser = (userId: string) => {
    if (window.confirm('Вы уверены, что хотите изменить статус блокировки пользователя?')) {
      blockUserMutation.mutate(userId);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const reason = window.prompt('Укажите причину удаления:');
    if (reason) {
      deleteUserMutation.mutate({ userId, reason });
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'destructive';
      case UserRole.OPERATOR: return 'default';
      case UserRole.VISITOR: return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Администратор';
      case UserRole.OPERATOR: return 'Оператор';
      case UserRole.VISITOR: return 'Посетитель';
      default: return role;
    }
  };

  const getStatusBadge = (user: UserType) => {
    if (user.isBlocked) {
      return <Badge variant="destructive" className="ml-2">Заблокирован</Badge>;
    }
    if (!user.isActivated) {
      return <Badge variant="outline" className="ml-2">Не активирован</Badge>;
    }
    if (user.profile.isOnline) {
      return <Badge variant="default" className="ml-2 bg-green-600">Онлайн</Badge>;
    }
    return <Badge variant="secondary" className="ml-2">Офлайн</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* Sidebar - Add Employee Form */}
          <aside className="w-full xl:w-80">
            <Card className="p-6 sticky top-8">
              <div className="flex items-center space-x-2 mb-6">
                <UserPlus className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Добавить сотрудника</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      placeholder="user@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Логин *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`pl-10 ${errors.username ? 'border-destructive' : ''}`}
                      placeholder="john_doe"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-destructive text-sm">{errors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                      placeholder="Минимум 6 символов"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password}</p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Фамилия Имя Отчество *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                    placeholder="Иванов Иван Иванович"
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-sm">{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                      placeholder="+79001234567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-sm">{errors.phone}</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Роль *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.OPERATOR}>Оператор</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
                      <SelectItem value={UserRole.VISITOR}>Посетитель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loading className="mr-2" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Сохранить
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </aside>

          {/* Main Content - Employee List */}
          <main className="flex-1">
            <div className="space-y-6">
              
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Сотрудники</h1>
                <p className="text-muted-foreground mt-1">
                  Управление сотрудниками системы
                </p>
              </div>

              {/* Search and Filters */}
              <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Поиск по имени, email или телефону..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Select
                      value={selectedRole || 'all'}
                      onValueChange={(value) => setSelectedRole(value === 'all' ? '' : value as UserRole)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Все роли" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все роли</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
                        <SelectItem value={UserRole.OPERATOR}>Оператор</SelectItem>
                        <SelectItem value={UserRole.VISITOR}>Посетитель</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRole('');
                      setPage(1);
                    }}
                  >
                    Сбросить
                  </Button>
                </div>
              </Card>

              {/* Users List */}
              <Card>
                {isLoading ? (
                  <div className="p-12 text-center">
                    <Loading className="mx-auto mb-4" />
                    <p className="text-muted-foreground">Загрузка сотрудников...</p>
                  </div>
                ) : !usersData?.data || usersData.data.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Сотрудники не найдены</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {usersData.data.map((user) => (
                      <div key={user._id} className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              {user.profile.avatarUrl ? (
                                <img
                                  src={user.profile.avatarUrl}
                                  alt={user.profile.fullName || user.profile.username}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-lg font-medium">
                                    {(user.profile.fullName || user.profile.username).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </Avatar>
                            
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <h3 className="font-medium text-foreground">
                                  {user.profile.fullName || user.profile.username}
                                </h3>
                                {getStatusBadge(user)}
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.profile.phone && (
                                <p className="text-sm text-muted-foreground">{user.profile.phone}</p>
                              )}
                              <div className="flex items-center space-x-2">
                                <Badge variant={getRoleColor(user.role)}>
                                  {getRoleLabel(user.role)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Зарегистрирован {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Operator Stats */}
                          {user.role === UserRole.OPERATOR && user.operatorStats && (
                            <div className="hidden lg:flex items-center space-x-6 text-sm">
                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{user.operatorStats.totalQuestions}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Вопросов</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium">{user.operatorStats.averageRating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Рейтинг</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">{Math.round(user.operatorStats.responseTimeAvg || 0)}м</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Ответ</p>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlockUser(user._id)}
                              className={user.isBlocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                            >
                              {user.isBlocked ? (
                                <>
                                  <Shield className="w-4 h-4 mr-1" />
                                  Разблокировать
                                </>
                              ) : (
                                <>
                                  <ShieldOff className="w-4 h-4 mr-1" />
                                  Заблокировать
                                </>
                              )}
                            </Button>
                            
                            {!user.isActivated && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => activateUserMutation.mutate(user._id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Активировать
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Удалить
                            </Button>
                          </div>
                        </div>

                        {/* Mobile Operator Stats */}
                        {user.role === UserRole.OPERATOR && user.operatorStats && (
                          <div className="lg:hidden mt-4 pt-4 border-t border-border">
                            <div className="flex justify-around text-sm">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <MessageSquare className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{user.operatorStats.totalQuestions}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Вопросов</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium">{user.operatorStats.averageRating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Рейтинг</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">{Math.round(user.operatorStats.responseTimeAvg || 0)}м</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Ответ</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="p-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Показано {((page - 1) * 10) + 1}-{Math.min(page * 10, usersData.total)} из {usersData.total} сотрудников
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Предыдущая
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, usersData.totalPages) }, (_, i) => {
                            const pageNumber = Math.max(1, page - 2) + i;
                            if (pageNumber > usersData.totalPages) return null;
                            return (
                              <Button
                                key={pageNumber}
                                variant={pageNumber === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(pageNumber)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === usersData.totalPages}
                        >
                          Следующая
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}