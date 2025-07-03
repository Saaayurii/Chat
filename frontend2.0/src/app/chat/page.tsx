'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Send, Plus, Paperclip, MoreVertical, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { chatAPI } from '@/core/api';
import { useChat } from '@/hooks/useChat';
import { Conversation, Message, User } from '@/types';
import * as Radix from '@radix-ui/themes';

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  // Мемоизируем фильтрацию бесед для оптимизации - улучшенная версия
  const filteredConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      // Проверяем текст последнего сообщения
      if (conv.lastMessage?.text?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Проверяем участников
      if (conv.participants && Array.isArray(conv.participants)) {
        return conv.participants.some((p: any) => {
          if (!p || typeof p !== 'object') return false;
          const username = p.profile?.username?.toLowerCase() || '';
          const fullName = p.profile?.fullName?.toLowerCase() || '';
          return username.includes(query) || fullName.includes(query);
        });
      }
      
      return false;
    });
  }, [conversations, searchQuery]);

  // Мемоизируем текущих печатающих пользователей
  const currentTypingUsers = useMemo(() => {
    return selectedConversation ? typingUsers[selectedConversation] || [] : [];
  }, [selectedConversation, typingUsers]);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - список чатов */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Чаты</h2>
            <div className="flex items-center space-x-2">
              {/* WebSocket статус */}
              <div className="flex items-center">
                {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : isConnecting ? <Radix.Spinner size="1" /> : <div className="cursor-pointer" title="Не подключено. Нажмите для переподключения" onClick={reconnect}><WifiOff className="w-4 h-4 text-red-500" /></div>}
              </div>
              <button className="p-2 hover:bg-accent rounded-lg">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск чатов..."
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
              <span className="ml-2">Загрузка чатов...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Нет активных чатов
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation._id
                      ? 'bg-accent border-l-4 border-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm truncate">
                      Беседа {conversation.type}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {conversation.lastMessage?.timestamp && new Date(conversation.lastMessage.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.text}
                    </p>
                  )}
                  
                  {conversation.unreadMessagesCount > 0 && (
                    <div className="flex justify-between items-center mt-2">
                      <div></div>
                      <Radix.Badge color="blue" variant="solid">
                        {conversation.unreadMessagesCount}
                      </Radix.Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-card border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Беседа</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">Участники: активны</p>
                    {!isConnected && (
                      <Radix.Badge color="red" variant="soft">
                        Не подключен
                      </Radix.Badge>
                    )}
                  </div>
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
    </div>
  );
}