'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Send, Plus, Paperclip, MoreVertical, Wifi, WifiOff, User, Phone, Mail, Shield, Globe, UserX, ArrowRightLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { chatAPI } from '@/core/api';
import { useChat } from '@/hooks/useChat';
import { Conversation, Message, User as UserType } from '@/types';
import * as Radix from '@radix-ui/themes';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI';
import Button from '@/components/UI/Button';


export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSender, setSelectedSender] = useState<any>(null);

  // WebSocket chat hook
  const {
    isConnected,
    isConnecting,
    wsError,
    typingUsers,
    onlineUsers,
    sendChatMessage,
    markAsRead,
    setTyping,
    joinConversation,
    leaveConversation,
    reconnect
  } = useChat();

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await chatAPI.getConversations();
      return response.data;
    }
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await chatAPI.getMessages(selectedConversation);
      return response.data;
    },
    enabled: !!selectedConversation
  });

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Отправляем через Socket.IO
    const success = sendChatMessage(selectedConversation, newMessage);
    
    if (success) {
      setNewMessage('');
      setIsTyping(false);
      setTyping(selectedConversation, false);
      
      // Очищаем таймер печатания
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [newMessage, selectedConversation, sendChatMessage, setTyping]);

  const handleMessageChange = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!selectedConversation) return;
    
    // Управление статусом "печатает"
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      setTyping(selectedConversation, true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      setTyping(selectedConversation, false);
    }
    
    // Сбрасываем таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Автоматически убираем статус "печатает" через 3 секунды
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(selectedConversation, false);
      }, 3000);
    }
  }, [selectedConversation, isTyping, setTyping]);

  const handleTransferChat = useCallback(() => {
    if (!selectedSender) return;
    // TODO: Implement transfer functionality
    console.log('Transfer chat for user:', selectedSender);
  }, [selectedSender]);

  const handleBlockUser = useCallback(() => {
    if (!selectedSender) return;
    // TODO: Implement block functionality
    console.log('Block user:', selectedSender);
  }, [selectedSender]);

  // Присоединяемся к беседе при выборе - исправленная версия
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation);
      
      return () => {
        leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation, joinConversation, leaveConversation]);

  // Автоскролл к последнему сообщению - оптимизированная версия
  const messagesLength = messages?.data?.length;
  useEffect(() => {
    if (messagesLength && messagesLength > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesLength]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Мемоизируем фильтрацию отправителей для оптимизации
  const filteredSenders = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    
    // Создаем список уникальных отправителей из бесед
    const sendersMap = new Map();
    conversations.forEach(conv => {
      if (conv.participants && Array.isArray(conv.participants)) {
        conv.participants.forEach((participant: any) => {
          if (participant && participant.id !== user?.id) {
            const senderId = participant.id;
            const existingSender = sendersMap.get(senderId);
            
            if (!existingSender || new Date(conv.lastMessage?.timestamp || 0) > new Date(existingSender.lastMessageTime || 0)) {
              sendersMap.set(senderId, {
                id: senderId,
                name: participant.profile?.fullName || participant.profile?.username || 'Неизвестный',
                type: participant.role === 'OPERATOR' ? 'operator' : 'visitor',
                avatar: participant.profile?.avatar,
                unreadCount: conv.unreadMessagesCount || 0,
                lastMessageTime: conv.lastMessage?.timestamp || new Date().toISOString(),
                isOnline: participant.isOnline || false,
                conversationId: conv._id,
                email: participant.profile?.email || '',
                phone: participant.profile?.phone || '',
                role: participant.role || 'VISITOR',
                isAuthorized: participant.isVerified || false,
                source: 'Веб-сайт' // TODO: получать из данных
              });
            }
          }
        });
      }
    });
    
    let senders = Array.from(sendersMap.values());
    
    // Сортируем по времени последнего сообщения
    senders.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    
    // Фильтруем по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      senders = senders.filter(sender => 
        sender.name.toLowerCase().includes(query) ||
        sender.email.toLowerCase().includes(query)
      );
    }
    
    return senders;
  }, [conversations, searchQuery, user?.id]);

  // Мемоизируем текущих печатающих пользователей
  const currentTypingUsers = useMemo(() => {
    return selectedConversation ? typingUsers[selectedConversation] || [] : [];
  }, [selectedConversation, typingUsers]);

  // Подсчитываем общее количество непрочитанных сообщений
  const totalUnreadMessages = useMemo(() => {
    return filteredSenders.reduce((total, sender) => total + (sender.unreadCount || 0), 0);
  }, [filteredSenders]);

  // Обработка выбора отправителя
  const handleSenderSelect = useCallback((sender: any) => {
    setSelectedSender(sender);
    setSelectedConversation(sender.conversationId);
  }, []);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - список отправителей */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-foreground">Сообщения</h2>
              {totalUnreadMessages > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {totalUnreadMessages}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* WebSocket статус */}
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
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={sender.avatar} />
                        <AvatarFallback>{sender.name[0]}</AvatarFallback>
                      </Avatar>
                      {sender.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {sender.name}
                        </p>
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
                        <Badge variant={sender.type === 'operator' ? 'default' : 'secondary'} className="text-xs">
                          {sender.type === 'operator' ? 'Оператор' : 'Посетитель'}
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
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedSender.avatar} />
                          <AvatarFallback>{selectedSender.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{selectedSender.name}</h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">
                              {selectedSender.isOnline ? 'В сети' : 'Не в сети'}
                            </p>
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
                
                {/* Показываем кто печатает */}
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
                          
                          {/* Статус прочтения */}
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
                
                {/* Скролл к последнему сообщению */}
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
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Выберите чат
                </h3>
                <p className="text-muted-foreground">
                  Выберите существующий чат или создайте новый
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
                <Avatar className="w-20 h-20 mx-auto mb-3">
                  <AvatarImage src={selectedSender.avatar} />
                  <AvatarFallback className="text-lg">{selectedSender.name[0]}</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold text-foreground">
                  {selectedSender.name}
                </h4>
                <Badge variant={selectedSender.type === 'operator' ? 'default' : 'secondary'} className="mt-2">
                  {selectedSender.type === 'operator' ? 'Оператор' : 'Посетитель'}
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

                    {selectedSender.type === 'visitor' && (
                      <>
                        <div className="flex items-center space-x-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Статус</p>
                            <p className="text-sm text-foreground">
                              {selectedSender.isAuthorized ? 'Авторизован' : 'Не авторизован'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Источник</p>
                            <p className="text-sm text-foreground">{selectedSender.source}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Online status */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h5 className="font-medium text-foreground mb-3">Статус</h5>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedSender.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-foreground">
                      {selectedSender.isOnline ? 'В сети' : 'Не в сети'}
                    </span>
                  </div>
                </div>

                {/* Action buttons for visitors */}
                {selectedSender.type === 'visitor' && (
                  <div className="space-y-2">
                    <Button 
                      onClick={handleTransferChat}
                      variant="outline" 
                      className="w-full"
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Перенаправить
                    </Button>
                    <Button 
                      onClick={handleBlockUser}
                      variant="destructive" 
                      className="w-full"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Заблокировать
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}