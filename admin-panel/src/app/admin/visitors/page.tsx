"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MessageSquare,
  Ban,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  Filter,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usersAPI } from "@/core/api";
import { UserRole } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/UI/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/UI/Avatar";
import Badge from "@/components/UI/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/Table";
import Pagination from "@/components/UI/Pagination";
import { PresenceIndicator, PresenceStatus } from "@/components/Presence";

function VisitorsPageContent() {
  const { user } = useAuthStore();
  const { 0: searchQuery, 1: setSearchQuery } = useState("");
  const { 0: statusFilter, 1: setStatusFilter } = useState("all");
  const { 0: sourceFilter, 1: setSourceFilter } = useState("all");
  const { 0: currentPage, 1: setCurrentPage } = useState(1);
  const { 0: pageSize } = useState(10);

  const { data: visitorsData, isLoading } = useQuery({
    queryKey: [
      "visitors",
      currentPage,
      pageSize,
      searchQuery,
      statusFilter,
      sourceFilter,
    ],
    queryFn: async () => {
      const response = await usersAPI.getUsers({
        role: UserRole.VISITOR,
        search: searchQuery,
        page: currentPage,
        limit: pageSize,
      });
      return response.data;
    },
  });

  const filteredVisitors = useMemo(() => {
    if (!visitorsData?.data) return [];

    let filtered = visitorsData.data;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((visitor) => {
        switch (statusFilter) {
          case "authorized":
            return visitor.isActivated && !visitor.isBlocked;
          case "unauthorized":
            return !visitor.isActivated && !visitor.isBlocked;
          case "blocked":
            return visitor.isBlocked;
          default:
            return true;
        }
      });
    }

    // Filter by source - removed as this property doesn't exist in User type

    return filtered;
  }, [visitorsData, statusFilter, sourceFilter]);

  const handleChatOpen = (visitorId: string) => {
    // Navigate to chat with specific visitor
    window.location.href = `/admin/chat?userId=${visitorId}`;
  };

  const handleBlockUser = (visitorId: string) => {
    // Open block user modal
    console.log("Block user:", visitorId);
  };

  const getStatusBadge = (visitor: any) => {
    if (visitor.isBlocked) {
      return <Badge variant="destructive">Заблокирован</Badge>;
    }
    if (visitor.isActivated) {
      return <Badge variant="success">Авторизован</Badge>;
    }
    return <Badge variant="secondary">Не авторизован</Badge>;
  };

  const getPresenceStatus = (isOnline: boolean) => {
    return isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Посетители</h1>
          <p className="text-muted-foreground">Управление посетителями чата</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Всего: {visitorsData?.total || 0} посетителей
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего посетителей
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitorsData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {visitorsData?.data?.filter((v) => v.profile?.isOnline).length ||
                0}{" "}
              в сети
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Авторизованные
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {visitorsData?.data?.filter((v) => v.isActivated).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Подтвержденные аккаунты
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Заблокированные
            </CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {visitorsData?.data?.filter((v) => v.isBlocked).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Заблокированные пользователи
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные чаты</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{0}</div>
            <p className="text-xs text-muted-foreground">Ведут диалоги</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="authorized">Авторизованные</SelectItem>
                  <SelectItem value="unauthorized">
                    Не авторизованные
                  </SelectItem>
                  <SelectItem value="blocked">Заблокированные</SelectItem>
                  <SelectItem value="online">В сети</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Источник</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все источники" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все источники</SelectItem>
                  <SelectItem value="website">Веб-сайт</SelectItem>
                  <SelectItem value="widget">Виджет</SelectItem>
                  <SelectItem value="mobile">Мобильное приложение</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Период</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Все время" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="week">За неделю</SelectItem>
                  <SelectItem value="month">За месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Список посетителей</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Посетитель</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead>Контакты</TableHead>
                    <TableHead>Регистрация</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={visitor.profile?.avatarUrl}
                              alt={visitor.profile?.fullName}
                            />
                            <AvatarFallback>
                              {visitor.profile?.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-foreground">
                                {visitor.profile?.fullName ||
                                  visitor.profile?.username ||
                                  "Неизвестный"}
                              </p>
                              <PresenceIndicator
                                status={getPresenceStatus(
                                  visitor.profile?.isOnline || false
                                )}
                                size="sm"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ID: {visitor.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(visitor)}
                          {/* Active chats info removed - property doesn't exist in User type */}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Веб-сайт</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{visitor.email}</span>
                          </div>
                          {visitor.profile?.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {visitor.profile.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(visitor.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChatOpen(visitor.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Чат
                          </Button>
                          {!visitor.isBlocked && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBlockUser(visitor.id)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Заблокировать
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {visitorsData && visitorsData.total > pageSize && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(visitorsData.total / pageSize)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VisitorsPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <VisitorsPageContent />
    </ProtectedRoute>
  );
}
