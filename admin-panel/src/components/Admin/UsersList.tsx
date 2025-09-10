"use client";

import {
  Shield,
  ShieldOff,
  Users,
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Button from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { Badge, Loading } from "@/components/UI";
import {
  PresenceIndicator,
  PresenceAvatar,
  PresenceStatus,
} from "@/components/Presence";
import { User as UserType, UserRole } from "@/types";

interface UsersListProps {
  usersData: any;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onBlockUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onActivateUser: (userId: string) => void;
}

var getRoleColor = (role: UserRole) => {
  var colorMap = {
    [UserRole.ADMIN]: "destructive",
    [UserRole.OPERATOR]: "default",
    [UserRole.VISITOR]: "secondary",
    default: "secondary",
  };
  return colorMap[role] || colorMap.default;
};

var getRoleLabel = (role: UserRole) => {
  var labelMap = {
    [UserRole.ADMIN]: "Администратор",
    [UserRole.OPERATOR]: "Оператор", 
    [UserRole.VISITOR]: "Посетитель",
    default: role,
  };
  return labelMap[role] || labelMap.default;
};

var getStatusBadge = (user: UserType) => {
  return user.isBlocked ? (
    <Badge variant="destructive" className="ml-2">
      Заблокирован
    </Badge>
  ) : !user.isActivated ? (
    <Badge variant="outline" className="ml-2">
      Не активирован
    </Badge>
  ) : user.profile.isOnline ? (
    <Badge variant="default" className="ml-2 bg-green-600">
      Онлайн
    </Badge>
  ) : (
    <Badge variant="secondary" className="ml-2">
      Офлайн
    </Badge>
  );
};

export var UsersList = ({
  usersData,
  isLoading,
  page,
  onPageChange,
  onBlockUser,
  onDeleteUser,
  onActivateUser,
}: UsersListProps) => (
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
          <div
            key={user._id}
            className="p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <PresenceAvatar
                  userId={user._id}
                  userName={user.profile.fullName || user.profile.username}
                  avatar={user.profile.avatarUrl}
                  status={PresenceStatus.OFFLINE}
                  size="md"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {user.profile.fullName || user.profile.username}
                    </h3>
                    <PresenceIndicator
                      status={PresenceStatus.OFFLINE}
                      size="sm"
                      showText={false}
                    />
                    {getStatusBadge(user)}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.profile.phone ? (
                    <p className="text-sm text-muted-foreground">
                      {user.profile.phone}
                    </p>
                  ) : null}
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Зарегистрирован{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === UserRole.OPERATOR && user.operatorStats ? (
                <div className="hidden lg:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {user.operatorStats.totalQuestions}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Вопросов</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">
                        {user.operatorStats.averageRating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Рейтинг</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">
                        {Math.round(user.operatorStats.responseTimeAvg || 0)}м
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ответ</p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBlockUser(user._id)}
                  className={
                    user.isBlocked
                      ? "text-green-600 hover:text-green-700"
                      : "text-red-600 hover:text-red-700"
                  }
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

                {!user.isActivated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActivateUser(user._id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Активировать
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteUser(user._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Удалить
                </Button>
              </div>
            </div>

            {user.role === UserRole.OPERATOR && user.operatorStats ? (
              <div className="lg:hidden mt-4 pt-4 border-t border-border">
                <div className="flex justify-around text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {user.operatorStats.totalQuestions}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Вопросов</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">
                        {user.operatorStats.averageRating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Рейтинг</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">
                        {Math.round(user.operatorStats.responseTimeAvg || 0)}м
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ответ</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    )}

    {usersData && usersData.totalPages > 1 ? (
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Показано {(page - 1) * 10 + 1}-
            {Math.min(page * 10, usersData.total)} из {usersData.total}{" "}
            сотрудников
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Предыдущая
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from(
                { length: Math.min(5, usersData.totalPages) },
                (_, i) => {
                  var pageNumber = Math.max(1, page - 2) + i;
                  return pageNumber > usersData.totalPages ? null : (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                }
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === usersData.totalPages}
            >
              Следующая
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    ) : null}
  </Card>
);