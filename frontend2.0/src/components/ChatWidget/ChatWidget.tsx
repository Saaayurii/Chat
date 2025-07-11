"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Star, Flag, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Input } from '../UI/Input';
import { Avatar } from '../UI/Avatar';
import { useSocketIO } from '../../hooks/useSocketIO';
import { useApiCall } from '../../hooks/useApiCall';
import RatingModal from './RatingModal';
import ComplaintModal from './ComplaintModal';
import ProfileModal from './ProfileModal';
import Button from '../UI/Button';
import { Badge } from '../UI';
import { 
  PresenceIndicator, 
  PresenceAvatar, 
  PresenceStatusSelector, 
  OnlineUsersList,
  usePresence,
  PresenceStatus 
} from '../Presence';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'operator';
  senderName?: string;
  attachments?: string[];
  type?: 'text' | 'file' | 'system';
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;


import { ChatWidgetProps } from './types';

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl = API_URL,
  theme = 'light',
  position = 'bottom-right',
  primaryColor = '#3b82f6',
  allowFileUpload = true,
  allowComplaint = true,
  allowRating = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  placeholder = 'Введите сообщение...',
  welcomeMessage = 'Добро пожаловать! Как могу помочь?',
  operatorName = 'Оператор',
  operatorAvatar,
  showPresence = true,
  showOnlineUsers = false,
  allowPresenceChange = true,
  onClose,
  onMinimize,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [operatorInfo, setOperatorInfo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Presence system integration
  const presence = usePresence({
    apiUrl: apiUrl || '',
    userId: userData?.id || 'anonymous',
    token: userToken || undefined,
    autoConnect: isAuthenticated && showPresence,
    enableCrossTabSync: true
  });
  
  const { isConnected: socketConnected, emit: emitSocketEvent, on: onSocketEvent, off: offSocketEvent } = useSocketIO('/chat', {
    onMessage: (message) => {
      console.log('Получено сообщение через WebSocket:', message);
      
      if (message.type === 'new_message') {
        const newMessage: Message = {
          id: message.data.id || Date.now().toString(),
          content: message.data.content,
          timestamp: new Date(message.data.timestamp),
          sender: message.data.sender === 'user' ? 'user' : 'operator',
          senderName: message.data.senderName || operatorName,
          type: message.data.type || 'text'
        };
        
        setMessages(prev => [...prev, newMessage]);
      } else if (message.type === 'typing') {
        setIsTyping(message.data.isTyping);
      } else if (message.type === 'operator_status') {
        setOperatorInfo(prev => ({
          ...prev,
          isOnline: message.data.isOnline
        }));
      }
    },
    onConnect: () => {
      console.log('WebSocket подключен');
      setIsConnected(true);
      
      // Присоединяемся к комнате беседы
      if (conversationId) {
        emitSocketEvent('join_conversation', { conversationId });
      }
    },
    onDisconnect: () => {
      console.log('WebSocket отключен');
      setIsConnected(false);
    },
    onError: (error) => {
      console.error('Ошибка WebSocket:', error);
      setIsConnected(false);
    },
    autoConnect: false
  });
  
  const { execute: createConversation } = useApiCall();
  const { execute: sendMessage } = useApiCall();
  const { execute: uploadFile } = useApiCall();
  const { execute: registerVisitor } = useApiCall();

  // Cookie utilities
  const setCookie = (name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  // Auth management
  const saveAuth = (token: string, user: any) => {
    setUserToken(token);
    setUserData(user);
    setIsAuthenticated(user.role !== 'VISITOR');
    
    setCookie('chat_widget_token', token);
    setCookie('chat_widget_user', encodeURIComponent(JSON.stringify(user)));
  };

  const clearAuth = () => {
    setUserToken(null);
    setUserData(null);
    setIsAuthenticated(false);
    deleteCookie('chat_widget_token');
    deleteCookie('chat_widget_user');
  };

  const checkExistingAuth = async () => {
    // Сначала проверяем токены основного приложения
    const appToken = getCookie('access_token') || localStorage.getItem('access_token');
    const appUserData = localStorage.getItem('user_data');
    
    // Потом проверяем токены виджета
    const widgetToken = getCookie('chat_widget_token');
    const widgetUserData = getCookie('chat_widget_user');
    
    console.log('Проверка авторизации:', { appToken: !!appToken, widgetToken: !!widgetToken, appUserData: !!appUserData, widgetUserData: !!widgetUserData });
    
    const token = appToken || widgetToken;
    let userData = null;
    
    if (appUserData) {
      try {
        userData = JSON.parse(appUserData);
        console.log('Данные пользователя из основного приложения:', userData);
      } catch (e) {
        console.error('Ошибка парсинга данных пользователя из основного приложения:', e);
      }
    } else if (widgetUserData) {
      try {
        userData = JSON.parse(decodeURIComponent(widgetUserData));
        console.log('Данные пользователя виджета:', userData);
      } catch (e) {
        console.error('Ошибка парсинга данных пользователя виджета:', e);
      }
    }
    
    if (token) {
      try {
        // Проверяем валидность токена
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Ответ от сервера /auth/me:', data);
          
          setUserToken(token);
          setUserData(data.user);
          setIsAuthenticated(data.user.role !== 'VISITOR');
          
          // Синхронизируем токены между приложением и виджетом
          if (appToken && !widgetToken) {
            console.log('Синхронизация токенов основного приложения с виджетом');
            setCookie('chat_widget_token', token);
            setCookie('chat_widget_user', encodeURIComponent(JSON.stringify(data.user)));
          }
          
          // Если есть данные пользователя, создаем беседу
          if (data.user && !conversationId) {
            await handleCreateConversation();
          }
        } else {
          console.error('Токен недействителен, статус:', response.status);
          clearAuth();
        }
      } catch (error) {
        console.error('Ошибка восстановления авторизации:', error);
        clearAuth();
      }
    } else {
      console.log('Токен не найден, пользователь не авторизован');
    }
  };

  useEffect(() => {
    checkExistingAuth();
    
    // Слушаем изменения в localStorage для синхронизации с основным приложением
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user_data') {
        console.log('Изменение в localStorage:', e.key, e.newValue);
        checkExistingAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Также проверяем каждые 5 секунд для случая, когда пользователь авторизуется в том же табе
    const interval = setInterval(() => {
      checkExistingAuth();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOpen && !userToken) {
      handleGuestRegistration();
    } else if (isOpen && userToken && !conversationId) {
      handleCreateConversation();
    }
  }, [isOpen, userToken, conversationId]);

  useEffect(() => {
    if (conversationId && userToken) {
      console.log('Подключение к WebSocket для беседы:', conversationId);
      
      // Подключаемся к WebSocket и присоединяемся к комнате беседы
      if (socketConnected) {
        emitSocketEvent('join_conversation', { conversationId });
      }
    }
  }, [conversationId, userToken, socketConnected, emitSocketEvent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGuestRegistration = async () => {
    // Проверяем есть ли уже сохраненный токен гостя
    const guestToken = getCookie('chat_widget_guest_token');
    if (guestToken) {
      try {
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${guestToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserToken(guestToken);
          setUserData(data.user);
          await handleCreateConversation();
          return;
        }
      } catch (error) {
        console.error('Ошибка проверки гостевого токена:', error);
      }
    }

    // Создаем нового гостя
    try {
      const guestId = getCookie('chat_widget_guest_id') || `guest_${Date.now()}`;
      setCookie('chat_widget_guest_id', guestId, 365);
      
      const response = await registerVisitor(() => 
        fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `${guestId}@temp.com`,
            password: `temp_${Date.now()}`,
            firstName: 'Посетитель',
            lastName: 'Сайта',
            role: 'VISITOR'
          })
        }).then(res => res.json())
      );
      
      if (response.success) {
        setUserToken(response.data.token);
        setUserData(response.data.user);
        setCookie('chat_widget_guest_token', response.data.token, 30);
        await handleCreateConversation();
      }
    } catch (error) {
      console.error('Ошибка регистрации посетителя:', error);
    }
  };

  const handleCreateConversation = async () => {
    if (!userToken) {
      console.log('Нет токена пользователя для создания беседы');
      return;
    }
    
    try {
      console.log('Создание беседы...');
      const response = await createConversation(() => 
        fetch(`${apiUrl}/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            type: 'support',
            title: 'Обращение с сайта'
          })
        }).then(res => res.json())
      );
      
      console.log('Ответ создания беседы:', response);
      
      if (response.success) {
        setConversationId(response.data.id);
        
        // Добавляем приветственное сообщение
        const welcomeMsg = {
          id: 'welcome',
          content: welcomeMessage,
          timestamp: new Date(),
          sender: 'operator' as const,
          senderName: operatorName,
          type: 'system' as const
        };
        
        console.log('Добавляем приветственное сообщение:', welcomeMsg);
        setMessages([welcomeMsg]);
        
        // Устанавливаем информацию об операторе (заглушка)
        setOperatorInfo({
          id: 'operator_1',
          name: operatorName,
          avatar: operatorAvatar,
          isOnline: true
        });
        
        setIsConnected(true);
      } else {
        console.error('Ошибка создания беседы:', response.error);
      }
    } catch (error) {
      console.error('Ошибка создания беседы:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || !userToken) return;
    
    const messageText = inputMessage;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      timestamp: new Date(),
      sender: 'user',
      type: 'text'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    try {
      console.log('Отправка сообщения:', messageText);
      
      const response = await sendMessage(() => 
        fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            content: messageText,
            type: 'text'
          })
        }).then(res => res.json())
      );
      
      console.log('Ответ отправки сообщения:', response);
      
      if (response.success) {
        // Отправляем сообщение через WebSocket для реального времени
        if (socketConnected) {
          emitSocketEvent('send_message', {
            conversationId,
            message: {
              id: response.data.id || Date.now().toString(),
              content: messageText,
              type: 'text'
            }
          });
        }
        
        // Имитируем ответ оператора через несколько секунд (для демонстрации)
        setTimeout(() => {
          const operatorResponse: Message = {
            id: Date.now().toString(),
            content: 'Спасибо за ваше сообщение! Оператор скоро ответит.',
            timestamp: new Date(),
            sender: 'operator',
            senderName: operatorName,
            type: 'text'
          };
          
          setMessages(prev => [...prev, operatorResponse]);
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > maxFileSize) {
      alert(`Файл слишком большой. Максимальный размер: ${maxFileSize / (1024 * 1024)}MB`);
      return;
    }
    
    if (!conversationId) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadFile(() => 
        fetch(`${apiUrl}/chat/conversations/${conversationId}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`
          },
          body: formData
        }).then(res => res.json())
      );
      
      if (response.success) {
        const fileMessage: Message = {
          id: Date.now().toString(),
          content: `Файл: ${file.name}`,
          timestamp: new Date(),
          sender: 'user',
          type: 'file',
          attachments: [response.data.url]
        };
        
        setMessages(prev => [...prev, fileMessage]);
        
        // Socket functionality removed for now
        console.log('File would be sent:', file.name);
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
    }
  };

  const handleRating = async (rating: number, comment?: string) => {
    if (!operatorInfo) return;
    
    // Если пользователь не авторизован, предлагаем войти
    if (!isAuthenticated) {
      const shouldLogin = confirm('Для оценки работы оператора необходимо войти в систему. Перейти на страницу входа?');
      if (shouldLogin) {
        window.location.href = '/login';
      }
      setShowRatingModal(false);
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          operatorId: operatorInfo.id,
          rating,
          comment: comment || '',
          conversationId
        })
      });
      
      if (response.ok) {
        setShowRatingModal(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Спасибо за оценку! Ваша оценка: ${rating} звезд`,
          timestamp: new Date(),
          sender: 'operator',
          type: 'system'
        }]);
      }
    } catch (error) {
      console.error('Ошибка отправки оценки:', error);
    }
  };

  const handleComplaint = async (reason: string, details: string) => {
    if (!operatorInfo) return;
    
    // Если пользователь не авторизован, предлагаем войти
    if (!isAuthenticated) {
      const shouldLogin = confirm('Для подачи жалобы необходимо войти в систему. Перейти на страницу входа?');
      if (shouldLogin) {
        window.location.href = '/login';
      }
      setShowComplaintModal(false);
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          operatorId: operatorInfo.id,
          reason,
          details,
          conversationId
        })
      });
      
      if (response.ok) {
        setShowComplaintModal(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: 'Ваша жалоба принята и будет рассмотрена',
          timestamp: new Date(),
          sender: 'operator',
          type: 'system'
        }]);
      }
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
    }
  };

  const handleLogout = async () => {
    if (userToken) {
      try {
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (error) {
        console.error('Ошибка выхода:', error);
      }
    }
    
    clearAuth();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: 'Вы вышли из системы',
      timestamp: new Date(),
      sender: 'operator',
      type: 'system'
    }]);
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (onClose && isOpen) onClose();
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
    if (onMinimize) onMinimize();
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-800 text-white'
  };

  if (!isOpen) {
    return (
      <div className={`${positionClasses[position]} z-50`}>
        <Button
          onClick={toggleWidget}
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${positionClasses[position]} z-50 w-96 h-[600px]`}>
      <Card className={`${themeClasses[theme]} shadow-2xl border-0 h-full flex flex-col`}>
        <CardHeader className="flex-row items-center justify-between p-4 border-b" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center space-x-3">
            {showPresence && presence.currentPresence ? (
              <PresenceAvatar
                userId={userData?.id || 'operator'}
                userName={isAuthenticated && userData ? 
                  (userData.fullName || userData.username) : 
                  (operatorInfo?.name || operatorName)
                }
                avatar={operatorAvatar}
                status={presence.currentPresence.status}
                size="sm"
                className="ring-2 ring-white"
              />
            ) : (
              <Avatar className="w-8 h-8 ring-2 ring-white">
                {operatorAvatar ? (
                  <img src={operatorAvatar} alt={operatorName} />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-white text-sm">
                  {isAuthenticated && userData ? 
                    (userData.fullName || userData.username) : 
                    (operatorInfo?.name || operatorName)
                  }
                </CardTitle>
                {showPresence && presence.currentPresence && (
                  <PresenceIndicator 
                    status={presence.currentPresence.status} 
                    size="sm"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {isAuthenticated ? 'Авторизован' : (presence.isConnected ? 'В сети' : 'Не в сети')}
                </Badge>
                {showPresence && presence.currentPresence && (
                  <span className="text-white/80 text-xs">
                    {presence.currentPresence.activity || 'Активен'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showPresence && allowPresenceChange && presence.currentPresence && (
              <PresenceStatusSelector
                currentStatus={presence.currentPresence.status}
                onStatusChange={(status) => presence.setStatus(status)}
                disabled={!presence.isConnected}
                className="mr-2"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={minimizeWidget}
              className="text-white hover:bg-white/20 p-1"
              aria-label="minimize"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleWidget}
              className="text-white hover:bg-white/20 p-1"
              aria-label="close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          {showOnlineUsers && presence.onlineUsers.length > 0 && (
            <div className="border-b p-3 bg-gray-50">
              <OnlineUsersList
                users={presence.onlineUsers}
                maxVisible={5}
                onUserClick={(userId) => {
                  console.log('User clicked:', userId);
                }}
                className="max-h-32 overflow-y-auto"
              />
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.type === 'system'
                      ? 'bg-gray-100 text-gray-600 text-center'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.attachments && (
                    <div className="mt-2">
                      {message.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Вложение {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm text-gray-600">Оператор печатает...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={placeholder}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              
              {allowFileUpload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2"
                  aria-label="paperclip"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="p-2"
                style={{ backgroundColor: primaryColor }}
                aria-label="send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/login'}
                  className="flex items-center space-x-1"
                >
                  <User className="w-4 h-4" />
                  <span className="text-xs">Войти</span>
                </Button>
              )}
              
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center space-x-1"
                >
                  <User className="w-4 h-4" />
                  <span className="text-xs">Профиль</span>
                </Button>
              )}
              
              {allowRating && operatorInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center space-x-1"
                >
                  <Star className="w-4 h-4" />
                  <span className="text-xs">Оценить</span>
                </Button>
              )}
              
              {allowComplaint && operatorInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComplaintModal(true)}
                  className="flex items-center space-x-1"
                >
                  <Flag className="w-4 h-4" />
                  <span className="text-xs">Жалоба</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRating}
        operatorName={operatorInfo?.name || operatorName}
      />
      
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSubmit={handleComplaint}
        operatorName={operatorInfo?.name || operatorName}
      />


      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={userData}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default ChatWidget;