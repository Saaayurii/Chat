'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, User, Shield, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/core/api';
import { UserRole } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Avatar } from '@/components/UI/Avatar';
import { Badge, Loading } from '@/components/UI';
import Button from '@/components/UI/Button';
import { PresenceIndicator, PresenceAvatar, PresenceStatus } from '@/components/Presence';

function OperatorColleaguesPageContent() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch colleagues (operators and admins)
  const { data: colleaguesData, isLoading } = useQuery({
    queryKey: ['colleagues', currentPage, debouncedSearchQuery],
    queryFn: async () => {
      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: 10,
        role: undefined, // Get all roles
        search: debouncedSearchQuery || undefined
      });
      
      // Filter out visitors and current user
      const colleagues = response.data.data.filter(
        (colleague: any) => 
          colleague.role !== UserRole.VISITOR && 
          colleague._id !== user?.id
      );
      
      return {
        ...response.data,
        data: colleagues
      };
    }
  });

  const handleStartChat = (colleagueId: string) => {
    // TODO: Implement chat functionality
    console.log('Start chat with colleague:', colleagueId);
    // This would typically navigate to the chat page and open conversation
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'destructive';
      case UserRole.OPERATOR: return 'default';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Администратор';
      case UserRole.OPERATOR: return 'Оператор';
      default: return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield className="w-4 h-4 text-red-600" />;
      case UserRole.OPERATOR: return <User className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (colleague: any) => {
    if (colleague.isBlocked) {
      return <Badge variant="destructive" className="ml-2">Заблокирован</Badge>;
    }
    if (!colleague.isActivated) {
      return <Badge variant="outline" className="ml-2">Не активирован</Badge>;
    }
    if (colleague.profile?.isOnline) {
      return <Badge variant="default" className="ml-2 bg-green-600">Онлайн</Badge>;
    }
    return <Badge variant="secondary" className="ml-2">Офлайн</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Коллеги</h1>
          </div>
          <p className="text-muted-foreground">
            Список всех операторов и администраторов системы
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск коллег по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Colleagues List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Список коллег</span>
              {colleaguesData?.total && (
                <Badge variant="secondary" className="ml-2">
                  {colleaguesData.total} {colleaguesData.total === 1 ? 'человек' : 'человек'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loading className="mr-2" />
                <span>Загрузка коллег...</span>
              </div>
            ) : !colleaguesData?.data || colleaguesData.data.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Коллеги не найдены</p>
              </div>
            ) : (
              <div className="space-y-4">
                {colleaguesData.data.map((colleague: any) => (
                  <div
                    key={colleague._id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <PresenceAvatar
                        userId={colleague._id}
                        userName={colleague.profile?.fullName || colleague.profile?.username || colleague.email}
                        avatar={colleague.profile?.avatarUrl}
                        status={colleague.profile?.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
                        size="md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-foreground">
                            {colleague.profile?.fullName || colleague.profile?.username || 'Без имени'}
                          </h3>
                          {getRoleIcon(colleague.role)}
                          <PresenceIndicator 
                            status={colleague.profile?.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
                            size="sm"
                          />
                          {getStatusBadge(colleague)}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{colleague.email}</span>
                          </div>
                          {colleague.profile?.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{colleague.profile.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={getRoleColor(colleague.role)}>
                            {getRoleLabel(colleague.role)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            В системе с {new Date(colleague.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartChat(colleague._id)}
                        className="flex items-center space-x-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Написать</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {colleaguesData && colleaguesData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Показано {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, colleaguesData.total)} из {colleaguesData.total} коллег
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Предыдущая
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, colleaguesData.totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, currentPage - 2) + i;
                      if (pageNumber > colleaguesData.totalPages) return null;
                      return (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === colleaguesData.totalPages}
                  >
                    Следующая
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OperatorColleaguesPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.OPERATOR}>
      <OperatorColleaguesPageContent />
    </ProtectedRoute>
  );
}