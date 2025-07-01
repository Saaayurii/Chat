'use client';

import { useState, useEffect, useRef } from 'react';
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
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Отправляем через WebSocket
    const success = sendChatMessage(selectedConversation, newMessage);
    
    if (success) {
      setNewMessage('');
      setIsTyping(false);
      setTyping(selectedConversation, false);
    }
  };

  const handleMessageChange = (value: string) => {
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
    }
    
    // Автоматически убираем статус "печатает" через 3 секунды
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        setTyping(selectedConversation, false);
      }
    }, 3000);
  };

  // Присоединяемся к беседе при выборе
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation);
    }
    
    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation);
      }
    };
  }, [selectedConversation, joinConversation, leaveConversation]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.data]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const filteredConversations = conversations?.filter(conv => 
    // Фильтрация по последнему сообщению или участникам
    conv.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const currentTypingUsers = selectedConversation ? typingUsers[selectedConversation] || [] : [];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - список чатов */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Чаты</h2>
            <div className="flex items-center space-x-2">
              {/* WebSocket статус */}
              <div className="flex items-center">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" title="Подключено" />
                ) : isConnecting ? (
                  <Radix.Spinner size="1" />
                ) : (
                  <WifiOff 
                    className="w-4 h-4 text-red-500 cursor-pointer" 
                    title="Не подключено. Нажмите для переподключения"
                    onClick={reconnect}
                  />
                )}
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4">
              <Radix.Spinner />
              <span className="ml-2">Загрузка чатов...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
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
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm truncate">
                      Беседа {conversation.type}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conversation.lastMessage?.timestamp && 
                        new Date(conversation.lastMessage.timestamp).toLocaleTimeString()
                      }
                    </span>
                  </div>
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
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
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Беседа</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">Участники: активны</p>
                    {!isConnected && (
                      <Radix.Badge color="red" variant="soft">
                        Не подключен
                      </Radix.Badge>
                    )}
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              {/* Показываем кто печатает */}
              {currentTypingUsers.length > 0 && (
                <div className="mt-2 text-sm text-gray-500 italic">
                  {currentTypingUsers.length === 1 
                    ? 'Пользователь печатает...' 
                    : `${currentTypingUsers.length} пользователей печатают...`}
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
                <div className="text-center text-gray-500">
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
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                        
                        {/* Статус прочтения */}
                        {message.senderId === user?.id && (
                          <div className="flex items-center space-x-1">
                            {message.readBy.length > 1 && (
                              <Radix.Badge size="1" variant="soft" color={message.senderId === user?.id ? 'blue' : 'gray'}>
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
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                
                <input
                  type="text"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  disabled={!isConnected}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Выберите чат
              </h3>
              <p className="text-gray-500">
                Выберите существующий чат или создайте новый
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}