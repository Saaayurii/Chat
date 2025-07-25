'use client';

import { useState, useCallback } from 'react';
import { X, Search, Bell, Wifi, WifiOff } from 'lucide-react';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import OnlineUsersList from '@/components/Presence/OnlineUsersList';
import PresenceAvatar from '@/components/Presence/PresenceAvatar';
import * as Radix from '@radix-ui/themes';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredSenders: any[];
  displayedSenders: any[];
  conversationsLoading: boolean;
  totalUnreadMessages: number;
  transferRequests: any[];
  onTransferRequestClick: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  onReconnect: () => void;
  selectedSender: any;
  onSenderSelect: (sender: any) => void;
  calculateUnreadCount: (conversationId: string) => number;
  onlineUsers: any[];
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

function ChatSidebar({
  isOpen,
  onClose,
  isMobile,
  searchQuery,
  onSearchChange,
  filteredSenders,
  displayedSenders,
  conversationsLoading,
  totalUnreadMessages,
  transferRequests,
  onTransferRequestClick,
  isConnected,
  isConnecting,
  onReconnect,
  selectedSender,
  onSenderSelect,
  calculateUnreadCount,
  onlineUsers,
  onScroll
}: ChatSidebarProps) {
  const formatLastMessageTime = useCallback((timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffInHours < 48) {
        return 'вчера';
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
          return `${diffInDays} дн. назад`;
        } else {
          return date.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit' 
          });
        }
      }
    } catch (error) {
      return '';
    }
  }, []);

  const getUserInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const truncateText = useCallback((text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  return (
    <div className={`
      ${isMobile 
        ? `fixed top-16 bottom-0 left-0 z-20 w-full max-w-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-border flex flex-col transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`
        : 'w-80 lg:w-96 bg-card border-r border-border flex flex-col'
      }
    `}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* Close sidebar button for mobile */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 lg:hidden mr-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              Сообщения
            </h2>
            {totalUnreadMessages > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {totalUnreadMessages}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Transfer requests notification */}
            {transferRequests && transferRequests.length > 0 && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTransferRequestClick}
                  className="h-8 w-8"
                >
                  <Bell className="w-4 h-4" />
                </Button>
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {transferRequests.length}
                </Badge>
              </div>
            )}

            {/* WebSocket status */}
            <div className="flex items-center space-x-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onReconnect}
                className="h-6 px-2 text-xs"
              >
                Reconnect
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск контактов..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-muted-foreground"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Online users */}
      {onlineUsers.length > 0 && (
        <div className="border-b border-border">
          <div className="p-3 bg-muted/30">
            <OnlineUsersList
              users={onlineUsers}
              maxVisible={3}
              onUserClick={(userId) => {
                // Логика для открытия чата с пользователем
              }}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto" onScroll={onScroll}>
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
            {displayedSenders.map((sender, index) => {
              const actualUnreadCount = sender.conversationId 
                ? Math.max(calculateUnreadCount(sender.conversationId), sender.unreadCount || 0)
                : (sender.unreadCount || 0);
              const hasUnread = actualUnreadCount > 0;
              
              return (
                <div
                  key={`${sender.id}-${sender.conversationId}-${index}`}
                  onClick={() => onSenderSelect(sender)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedSender?.id === sender.id && selectedSender?.conversationId === sender.conversationId
                      ? "bg-accent border-l-4 border-primary"
                      : hasUnread
                      ? "hover:bg-accent bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500 shadow-sm"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <PresenceAvatar
                      userId={sender.id}
                      userName={sender.name}
                      avatar={sender.avatar}
                      showStatus={true}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${
                          hasUnread ? 'text-foreground' : 'text-foreground'
                        }`}>
                          {sender.name}
                        </p>
                        <div className="flex items-center space-x-1">
                          {sender.lastMessageTime && (
                            <span className={`text-xs ${
                              hasUnread ? 'text-primary font-medium' : 'text-muted-foreground'
                            }`}>
                              {formatLastMessageTime(sender.lastMessageTime)}
                            </span>
                          )}
                          {hasUnread && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                            >
                              {actualUnreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {sender.lastMessage && (
                        <p className={`text-xs mt-1 truncate ${
                          hasUnread ? 'text-muted-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                          {truncateText(sender.lastMessage)}
                        </p>
                      )}
                      {sender.role && (
                        <Badge 
                          variant={sender.role === 'ADMIN' ? 'destructive' : sender.role === 'OPERATOR' ? 'default' : 'secondary'}
                          className="mt-1 text-xs"
                        >
                          {sender.role === 'ADMIN' ? 'Admin' : sender.role === 'OPERATOR' ? 'Operator' : 'User'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { ChatSidebar };
export default ChatSidebar;