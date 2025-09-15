"use client";

import { Mail, Phone, MessageSquare, User, Shield } from "lucide-react";
import { UserRole } from "@/types";
import { Badge } from "@/components/UI";
import Button from "@/components/UI/Button";
import {
  PresenceAvatar,
  PresenceIndicator,
  PresenceStatus,
} from "@/components/Presence";

interface ColleagueCardProps {
  colleague: {
    _id: string;
    email: string;
    role: typeof UserRole[keyof typeof UserRole];
    isBlocked: boolean;
    isActivated: boolean;
    createdAt: string;
    profile?: {
      fullName?: string;
      username?: string;
      phone?: string;
      avatarUrl?: string;
      isOnline?: boolean;
    };
  };
  onStartChat: (colleagueId: string) => void;
}

var ColleagueCard = ({ colleague, onStartChat }: ColleagueCardProps) => {
  var getRoleColor = (role: typeof UserRole[keyof typeof UserRole]) => {
    return role === UserRole.ADMIN ? "destructive" :
           role === UserRole.OPERATOR ? "default" : 
           "secondary";
  };

  var getRoleLabel = (role: typeof UserRole[keyof typeof UserRole]) => {
    return role === UserRole.ADMIN ? "Администратор" :
           role === UserRole.OPERATOR ? "Оператор" :
           role;
  };

  var getRoleIcon = (role: typeof UserRole[keyof typeof UserRole]) => {
    return role === UserRole.ADMIN ? 
      <Shield className="w-4 h-4 text-red-600" /> :
      role === UserRole.OPERATOR ? 
        <User className="w-4 h-4 text-blue-600" /> :
        <User className="w-4 h-4 text-gray-600" />;
  };

  var getStatusBadge = () => {
    return colleague.isBlocked ? (
      <Badge variant="destructive" className="ml-2">
        Заблокирован
      </Badge>
    ) : !colleague.isActivated ? (
      <Badge variant="outline" className="ml-2">
        Не активирован
      </Badge>
    ) : colleague.profile?.isOnline ? (
      <Badge variant="default" className="ml-2 bg-green-600">
        Онлайн
      </Badge>
    ) : (
      <Badge variant="secondary" className="ml-2">
        Офлайн
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <PresenceAvatar
          userId={colleague._id}
          userName={
            colleague.profile?.fullName ||
            colleague.profile?.username ||
            colleague.email
          }
          avatar={colleague.profile?.avatarUrl}
          status={
            colleague.profile?.isOnline
              ? PresenceStatus.ONLINE
              : PresenceStatus.OFFLINE
          }
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-foreground">
              {colleague.profile?.fullName ||
                colleague.profile?.username ||
                "Без имени"}
            </h3>
            {getRoleIcon(colleague.role)}
            <PresenceIndicator
              status={
                colleague.profile?.isOnline
                  ? PresenceStatus.ONLINE
                  : PresenceStatus.OFFLINE
              }
              size="sm"
            />
            {getStatusBadge()}
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
              В системе с {new Date(colleague.createdAt).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStartChat(colleague._id)}
          className="flex items-center space-x-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Написать</span>
        </Button>
      </div>
    </div>
  );
};

export default ColleagueCard;