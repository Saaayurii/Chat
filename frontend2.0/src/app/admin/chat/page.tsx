'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Send, Paperclip, MoreVertical, Wifi, WifiOff, User, Phone, Mail, Shield, Globe, UserX, ArrowRightLeft, Crown, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { chatAPI } from '@/core/api';
import { useChat } from '@/hooks/useChat';
import { User as UserType, UserRole } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

interface SenderType {
  id: string;
  name: string;
  type: 'operator' | 'visitor' | 'admin';
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

import * as Radix from '@radix-ui/themes';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI';
import Button from '@/components/UI/Button';
import { PresenceIndicator, PresenceAvatar, OnlineUsersList, PresenceStatus, usePresence } from '@/components/Presence';

function AdminChatPageContent() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSender, setSelectedSender] = useState<SenderType | null>(null);

  // WebSocket chat hook
  const {
    isConnected,
    isConnecting,
    typingUsers,
    sendChatMessage,
    setTyping,
    joinConversation,
    leaveConversation,
    reconnect
  } = useChat();

  // Presence system for admin
  const presence = usePresence({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
    userId: user?.id || 'anonymous',
    token: user?.token,
    autoConnect: !!user,
    enableCrossTabSync: true
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const response = await chatAPI.getConversations();
      return response.data;
    }
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await chatAPI.getMessages(selectedConversation);
      return response.data;
    },
    enabled: !!selectedConversation
  });

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const success = sendChatMessage(selectedConversation, newMessage);
    
    if (success) {
      setNewMessage('');
      setIsTyping(false);
      setTyping(selectedConversation, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [newMessage, selectedConversation, sendChatMessage, setTyping]);

  const handleMessageChange = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!selectedConversation) return;
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      setTyping(selectedConversation, true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      setTyping(selectedConversation, false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(selectedConversation, false);
      }, 3000);
    }
  }, [selectedConversation, isTyping, setTyping]);

  const handleTransferToOperator = useCallback(() => {
    if (!selectedSender) return;
    console.log('Transfer to operator:', selectedSender);
    // TODO: Implement transfer to operator
  }, [selectedSender]);

  const handleBlockUser = useCallback(() => {
    if (!selectedSender) return;
    console.log('Block user:', selectedSender);
    // TODO: Implement block user
  }, [selectedSender]);

  const handleManageOperator = useCallback(() => {
    if (!selectedSender) return;
    console.log('Manage operator:', selectedSender);
    // TODO: Implement operator management
  }, [selectedSender]);

  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation);
      
      return () => {
        leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation, joinConversation, leaveConversation]);

  const messagesLength = messages?.data?.length;
  useEffect(() => {
    if (messagesLength && messagesLength > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesLength]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Все собеседники (операторы, посетители и другие админы)
  const filteredSenders = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    
    const sendersMap = new Map();
    conversations.forEach(conv => {
      if (conv.participants && Array.isArray(conv.participants)) {
        conv.participants.forEach((participant: any) => {
          if (participant && participant.id !== user?.id) {
            const senderId = participant.id;
            const existingSender = sendersMap.get(senderId);
            
            if (!existingSender || new Date(conv.lastMessage?.timestamp || 0) > new Date(existingSender.lastMessageTime || 0)) {
              let type: 'operator' | 'visitor' | 'admin' = 'visitor';
              if (participant.role === UserRole.OPERATOR) type = 'operator';
              else if (participant.role === UserRole.ADMIN) type = 'admin';
              
              sendersMap.set(senderId, {
                id: senderId,
                name: participant.profile?.fullName || participant.profile?.username || 'Неизвестный',
                type,
                avatar: participant.profile?.avatarUrl,
                unreadCount: conv.unreadMessagesCount || 0,
                lastMessageTime: conv.lastMessage?.timestamp || new Date().toISOString(),
                isOnline: participant.profile?.isOnline || false,
                conversationId: conv._id,
                email: participant.email || '',
                phone: participant.profile?.phone || '',
                role: participant.role || 'VISITOR',
                isAuthorized: participant.isActivated || false,
                source: 'Веб-сайт'
              });
            }
          }
        });
      }
    });
    
    let senders = Array.from(sendersMap.values());
    
    senders.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      senders = senders.filter(sender => 
        sender.name.toLowerCase().includes(query) ||
        sender.email.toLowerCase().includes(query)
      );
    }
    
    return senders;
  }, [conversations, searchQuery, user?.id]);

  const currentTypingUsers = useMemo(() => {
    return selectedConversation ? typingUsers[selectedConversation] || [] : [];
  }, [selectedConversation, typingUsers]);

  const totalUnreadMessages = useMemo(() => {
    return filteredSenders.reduce((total, sender) => total + (sender.unreadCount || 0), 0);
  }, [filteredSenders]);

  const handleSenderSelect = useCallback((sender: SenderType) => {
    setSelectedSender(sender);
    setSelectedConversation(sender.conversationId || null);
  }, []);

  const getSenderTypeIcon = (type: string) => {
    switch (type) {
      case 'admin': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'operator': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSenderTypeLabel = (type: string) => {
    switch (type) {
      case 'admin': return 'Администратор';
      case 'operator': return 'Оператор';
      default: return 'Посетитель';
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - список собеседников */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-foreground">Сообщения (Администратор)</h2>
              {totalUnreadMessages > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {totalUnreadMessages}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : isConnecting ? <Radix.Spinner size="1" /> : <div className="cursor-pointer" title="Не подключено. Нажмите для переподключения" onClick={reconnect}><WifiOff className="w-4 h-4 text-red-500" /></div>}
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

        {/* Онлайн пользователи */}
        {presence.onlineUsers.length > 0 && (
          <div className="border-b border-border">
            <div className="p-3 bg-muted/30">
              <OnlineUsersList
                users={presence.onlineUsers}
                maxVisible={3}
                onUserClick={(userId) => {
                  console.log('Clicked online user:', userId);
                }}
                className="text-sm"
              />
            </div>
          </div>
        )}

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
                  onClick={() => handleSenderSelect(sender)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSender?.id === sender.id
                      ? 'bg-accent border-l-4 border-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <PresenceAvatar
                      userId={sender.id}
                      userName={sender.name}
                      avatar={sender.avatar}
                      status={sender.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
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
                          {sender.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                              {sender.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={sender.type === 'admin' ? 'destructive' : sender.type === 'operator' ? 'default' : 'secondary'} className="text-xs">
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

      {/* Main chat area */}
      <div className="flex-1 flex">
        {/* Chat messages */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 bg-card border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedSender && (
                      <>
                        <PresenceAvatar
                          userId={selectedSender.id}
                          userName={selectedSender.name || 'Неизвестный'}
                          avatar={selectedSender.avatar}
                          status={selectedSender.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{selectedSender.name || 'Неизвестный'}</h3>
                            {getSenderTypeIcon(selectedSender.type)}
                            <PresenceIndicator 
                              status={selectedSender.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
                              size="sm"
                              showText={true}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={selectedSender.type === 'admin' ? 'destructive' : selectedSender.type === 'operator' ? 'default' : 'secondary'} className="text-xs">
                              {getSenderTypeLabel(selectedSender.type)}
                            </Badge>
                            {!isConnected && (
                              <Radix.Badge color="red" variant="soft">
                                Не подключен
                              </Radix.Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <button className="p-2 hover:bg-accent rounded-lg">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                {currentTypingUsers.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground italic">
                    {currentTypingUsers.length === 1 ? 'Пользователь печатает...' : `${currentTypingUsers.length} пользователей печатают...`}
                  </div>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center">
                    <Radix.Spinner />
                  </div>
                ) : messages?.data?.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Начните общение, отправив первое сообщение
                  </div>
                ) : (
                  messages?.data?.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                          
                          {message.senderId === user?.id && (
                            <div className="flex items-center space-x-1">
                              {message.readBy.length > 1 && (
                                <Radix.Badge size="1" variant="soft" color="blue">
                                  ✓ {message.readBy.length - 1}
                                </Radix.Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 bg-card border-t border-border">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-accent rounded-lg">
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    disabled={!isConnected}
                  />
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Панель администратора
                </h3>
                <p className="text-muted-foreground">
                  Выберите пользователя для общения
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User info sidebar */}
        {selectedSender && (
          <div className="w-80 bg-card border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Информация о пользователе</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Avatar and basic info */}
              <div className="text-center">
                <div className="mb-3">
                  <PresenceAvatar
                    userId={selectedSender.id}
                    userName={selectedSender.name || 'Неизвестный'}
                    avatar={selectedSender.avatar}
                    status={selectedSender.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <h4 className="font-semibold text-foreground">
                  {selectedSender.name || 'Неизвестный'}
                </h4>
                <div className="flex justify-center mt-2">
                  <PresenceIndicator 
                    status={selectedSender.isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE}
                    size="sm"
                    showText={true}
                  />
                </div>
                <Badge variant={selectedSender.type === 'admin' ? 'destructive' : selectedSender.type === 'operator' ? 'default' : 'secondary'} className="mt-2">
                  {getSenderTypeLabel(selectedSender.type)}
                </Badge>
              </div>

              {/* User details */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <h5 className="font-medium text-foreground mb-3">Контактная информация</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">ID</p>
                        <p className="text-sm text-foreground font-mono">{selectedSender.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm text-foreground">{selectedSender.email || 'Не указан'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Телефон</p>
                        <p className="text-sm text-foreground">{selectedSender.phone || 'Не указан'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h5 className="font-medium text-foreground mb-3">Статус</h5>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedSender.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-foreground">
                      {selectedSender.isOnline ? 'В сети' : 'Не в сети'}
                    </span>
                  </div>
                </div>

                {/* Admin actions */}
                <div className="space-y-2">
                  {selectedSender.type === 'visitor' && (
                    <>
                      <Button 
                        onClick={handleTransferToOperator}
                        variant="outline" 
                        className="w-full"
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Перенаправить оператору
                      </Button>
                      <Button 
                        onClick={handleBlockUser}
                        variant="destructive" 
                        className="w-full"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Заблокировать
                      </Button>
                    </>
                  )}
                  
                  {selectedSender.type === 'operator' && (
                    <Button 
                      onClick={handleManageOperator}
                      variant="outline" 
                      className="w-full"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Управление оператором
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminChatPageContent />
    </ProtectedRoute>
  );
}