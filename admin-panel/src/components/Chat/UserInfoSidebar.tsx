"use client";

import { useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Tag,
  Shield,
  FileText,
  History,
} from "lucide-react";
import Button from "@/components/UI/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/UI/Avatar";
import Badge from "@/components/UI/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { ChatUser, UserRole } from "@/types";

interface UserInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: ChatUser | null;
  isMobile: boolean;
}

function UserInfoSidebar({
  isOpen,
  onClose,
  selectedUser,
  isMobile,
}: UserInfoSidebarProps) {
  const { 0: activeTab, 1: setActiveTab } = useState<"info" | "history">(
    "info"
  );

  if (!selectedUser) return null;

  const getUserInitials = (user: ChatUser) => {
    if (user.profile?.fullName) {
      return user.profile.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.profile?.username) {
      return user.profile.username.slice(0, 2).toUpperCase();
    }
    return user.email?.slice(0, 2).toUpperCase() || "U";
  };

  const formatDate = (date: string | Date) => {
    try {
      const targetDate = new Date(date);
      const now = new Date();
      const diffInHours =
        (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return "только что";
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours} ч. назад`;
      } else if (diffInHours < 48) {
        return "вчера";
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
          return `${diffInDays} дн. назад`;
        } else {
          return targetDate.toLocaleDateString("ru-RU");
        }
      }
    } catch (error) {
      return "неизвестно";
    }
  };

  return (
    <div
      className={`
      ${
        isMobile
          ? `fixed top-16 bottom-0 right-0 z-30 w-full max-w-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-l border-border flex flex-col transition-transform duration-300 ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`
          : "w-80 lg:w-96 bg-card border-l border-border flex flex-col"
      }
    `}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Информация о пользователе
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex mt-4 space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${
              activeTab === "info"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Информация
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            История
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "info" && (
          <>
            {/* User Avatar and Name */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedUser.profile?.avatarUrl}
                      alt={selectedUser.profile?.username || selectedUser.email}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getUserInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-foreground">
                      {selectedUser.profile?.fullName ||
                        selectedUser.profile?.username ||
                        "Пользователь"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge
                        variant={
                          selectedUser.role === UserRole.ADMIN
                            ? "destructive"
                            : selectedUser.role === UserRole.OPERATOR
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedUser.role === UserRole.ADMIN
                          ? "Администратор"
                          : selectedUser.role === UserRole.OPERATOR
                          ? "Оператор"
                          : "Посетитель"}
                      </Badge>
                      <Badge
                        variant={
                          selectedUser.profile?.isOnline
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedUser.profile?.isOnline ? "Онлайн" : "Оффлайн"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                {selectedUser.profile?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedUser.profile.phone}
                    </span>
                  </div>
                )}
                {selectedUser.profile?.username && (
                  <div className="flex items-center space-x-3">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      @{selectedUser.profile.username}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Информация об аккаунте
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Роль:</span>
                  <Badge
                    variant={
                      selectedUser.role === UserRole.ADMIN
                        ? "destructive"
                        : selectedUser.role === UserRole.OPERATOR
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedUser.role === UserRole.ADMIN
                      ? "Администратор"
                      : selectedUser.role === UserRole.OPERATOR
                      ? "Оператор"
                      : "Посетитель"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Статус:</span>
                  <Badge
                    variant={
                      selectedUser.profile?.isOnline ? "default" : "secondary"
                    }
                  >
                    {selectedUser.profile?.isOnline ? "Онлайн" : "Оффлайн"}
                  </Badge>
                </div>
                {selectedUser.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Регистрация:
                    </span>
                    <span className="text-sm">
                      {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                )}
                {selectedUser.profile?.lastSeenAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Последняя активность:
                    </span>
                    <span className="text-sm">
                      {formatDate(selectedUser.profile.lastSeenAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            {selectedUser.operatorStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Статистика
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Всего сообщений:
                    </span>
                    <span className="text-sm font-medium">
                      {selectedUser.operatorStats.totalQuestions || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Всего чатов:
                    </span>
                    <span className="text-sm font-medium">
                      {selectedUser.operatorStats.resolvedQuestions || 0}
                    </span>
                  </div>
                  {selectedUser.operatorStats.averageRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Средняя оценка:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedUser.operatorStats.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <History className="w-4 h-4 mr-2" />
                История взаимодействий
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-center text-muted-foreground py-8">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>История будет доступна в следующих обновлениях</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default UserInfoSidebar;
