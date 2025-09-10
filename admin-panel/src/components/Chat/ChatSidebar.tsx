"use client";

import { Search, Crown, Wifi, WifiOff, User, Shield } from "lucide-react";
import { Badge } from "@/components/UI";
import {
  OnlineUsersList,
  PresenceAvatar,
  PresenceStatus,
} from "@/components/Presence";
import * as Radix from "@radix-ui/themes";

interface SenderType {
  id: string;
  name: string;
  type: "operator" | "visitor" | "admin";
  avatar?: string;
  unreadCount: number;
  lastMessageTime: string;
  isOnline: boolean;
  conversationId?: string;
  email: string;
  phone?: string;
  role: string;
  isAuthorized: boolean;
  source?: string;
}

interface ChatSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredSenders: SenderType[];
  selectedSender: SenderType | null;
  onSenderSelect: (sender: SenderType) => void;
  isConnected: boolean;
  isConnecting: boolean;
  onReconnect: () => void;
  conversationsLoading: boolean;
  totalUnreadMessages: number;
  onlineUsers: any[];
}

var getSenderTypeIcon = (type: string) => {
  var iconMap = {
    admin: () => <Crown className="w-4 h-4 text-purple-600" />,
    operator: () => <Shield className="w-4 h-4 text-blue-600" />,
    default: () => <User className="w-4 h-4 text-gray-600" />
  };
  return (iconMap[type] || iconMap.default)();
};

var getSenderTypeLabel = (type: string) => {
  var labelMap = {
    admin: "Администратор",
    operator: "Оператор",
    default: "Посетитель"
  };
  return labelMap[type] || labelMap.default;
};

export var ChatSidebar = ({
  searchQuery,
  setSearchQuery,
  filteredSenders,
  selectedSender,
  onSenderSelect,
  isConnected,
  isConnecting,
  onReconnect,
  conversationsLoading,
  totalUnreadMessages,
  onlineUsers
}: ChatSidebarProps) => (
  <div className="w-80 bg-card border-r border-border flex flex-col">
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-foreground">
            Сообщения (Администратор)
          </h2>
          {totalUnreadMessages > 0 ? (
            <Badge
              variant="destructive"
              className="h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {totalUnreadMessages}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : isConnecting ? (
              <Radix.Spinner size="1" />
            ) : (
              <div
                className="cursor-pointer"
                title="Не подключено. Нажмите для переподключения"
                onClick={onReconnect}
              >
                <WifiOff className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Поиск контактов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-muted-foreground"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
    </div>

    {onlineUsers.length > 0 ? (
      <div className="border-b border-border">
        <div className="p-3 bg-muted/30">
          <OnlineUsersList
            users={onlineUsers}
            maxVisible={3}
            onUserClick={(userId) => {
              console.log("Clicked online user:", userId);
            }}
            className="text-sm"
          />
        </div>
      </div>
    ) : null}

    <div className="flex-1 overflow-y-auto">
      {conversationsLoading ? (
        <div className="p-4">
          <Radix.Spinner />
          <span className="ml-2">Загрузка контактов...</span>
        </div>
      ) : filteredSenders.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          Нет активных контактов
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {filteredSenders.map((sender) => (
            <div
              key={sender.id}
              onClick={() => onSenderSelect(sender)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedSender?.id === sender.id
                  ? "bg-accent border-l-4 border-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div className="flex items-center space-x-3">
                <PresenceAvatar
                  userId={sender.id}
                  userName={sender.name}
                  avatar={sender.avatar}
                  status={
                    sender.isOnline
                      ? PresenceStatus.ONLINE
                      : PresenceStatus.OFFLINE
                  }
                  size="sm"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sender.name}
                      </p>
                      {getSenderTypeIcon(sender.type)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(sender.lastMessageTime).toLocaleTimeString()}
                      </span>
                      {sender.unreadCount > 0 ? (
                        <Badge
                          variant="destructive"
                          className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                          {sender.unreadCount}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant={
                        sender.type === "admin"
                          ? "destructive"
                          : sender.type === "operator"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {getSenderTypeLabel(sender.type)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);