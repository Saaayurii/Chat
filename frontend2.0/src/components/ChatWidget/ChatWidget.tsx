"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Paperclip, Star, Flag, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Input } from '../UI/Input';
import { Avatar } from '../UI/Avatar';
import { useSocketIO } from '../../hooks/useSocketIO';
import { useApiCall } from '../../hooks/useApiCall';
import RatingModal from './RatingModal';
import ComplaintModal from './ComplaintModal';
import ProfileModal from './ProfileModal';
import AuthModal from './AuthModal';
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
import { useAuthStore } from '@/store/authStore';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'reset'>('login');
  const { token: authToken, user: authUser, isAuthenticated: authIsAuthenticated, setAuth } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(authIsAuthenticated);
  const [userToken, setUserToken] = useState<string | null>(authToken);
  const [userData, setUserData] = useState<any>(authUser);
  const [operatorInfo, setOperatorInfo] = useState<any>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Presence system integration
  const presence = usePresence({
    apiUrl: apiUrl || '',
    userId: userData?._id || userData?.id || 'anonymous',
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
          content: message.data.text || message.data.content,
          timestamp: new Date(message.data.timestamp),
          sender: message.data.senderId === (userData?._id || userData?.id) ? 'user' : 'operator',
          senderName: message.data.senderName || operatorName,
          type: message.data.type || 'text'
        };
        
        setMessages(prev => [...prev, newMessage]);
      } else if (message.type === 'typing') {
        setIsTyping(message.data.isTyping);
      } else if (message.type === 'operator_status') {
        setOperatorInfo((prev: any) => ({
          ...prev,
          isOnline: message.data.isOnline
        }));
      } else if (message.type === 'message-sent') {
        console.log('Сообщение успешно отправлено:', message);
      } else if (message.type === 'cached-messages') {
        // Загружаем кэшированные сообщения
        const cachedMessages = message.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.text,
          timestamp: new Date(msg.timestamp),
          sender: msg.senderId === (userData?._id || userData?.id) ? 'user' : 'operator',
          senderName: msg.senderName || operatorName,
          type: msg.type || 'text'
        }));
        
        setMessages(prev => [...cachedMessages, ...prev]);
        console.log('Загружены кэшированные сообщения:', cachedMessages.length, 'из', message.source);
      }
    },
    onConnect: () => {
      console.log('WebSocket подключен');
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log('WebSocket отключен');
      setIsConnected(false);
    },
    onError: (error) => {
      console.error('Ошибка WebSocket:', error);
      setIsConnected(false);
    },
    autoConnect: false // Отключаем автоподключение
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
    
    // Update auth store for socket connection
    if (user.role !== 'VISITOR') {
      setAuth(token, user);
    }
    
    setCookie('chat_widget_token', token);
    setCookie('chat_widget_user', encodeURIComponent(JSON.stringify(user)));
  };

  const clearAuth = () => {
    setUserToken(null);
    setUserData(null);
    setIsAuthenticated(false);
    
    // Очищаем токены и данные пользователя
    deleteCookie('chat_widget_token');
    deleteCookie('chat_widget_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    
    // Обновляем auth store
    setAuth(null, null);
  };

  const handleGuestRegistration = useCallback(async () => {
    // Для анонимных пользователей не используем токены, сразу создаем временного пользователя
    console.log('Создание анонимного пользователя для виджета');
    const anonymousUserId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = crypto.randomUUID();
    const anonymousUser = {
      id: anonymousUserId,
      _id: anonymousUserId,
      email: `anonymous@widget.temp`,
      firstName: 'Посетитель',
      lastName: 'Сайта',
      role: 'VISITOR',
      isAnonymous: true,
      sessionId: sessionId
    };
    
    setUserData(anonymousUser);
    setUserToken('anonymous');
    setIsAuthenticated(false);
    console.log('Анонимный пользователь создан');
    return;
  }, [apiUrl]);

  const getAvailableOperator = useCallback(async () => {
    try {
      console.log('Получение доступного оператора...');
      
      // Сначала пытаемся получить онлайн операторов через presence
      let operators = [];
      
      // Попробуем получить через онлайн пользователей, если присутствие активно
      if (presence?.onlineUsers && presence.onlineUsers.length > 0) {
        // Фильтруем только операторов среди онлайн пользователей
        const onlineOperators = presence.onlineUsers.filter(user => 
          user.role === 'OPERATOR' || user.role === 'ADMIN'
        );
        
        if (onlineOperators.length > 0) {
          const operator = onlineOperators[0];
          console.log('Найден онлайн оператор через presence:', operator);
          return {
            id: operator.userId,
            name: operator.displayName || 'Оператор',
            avatar: operator.avatar,
            isOnline: true
          };
        }
      }
      
      // Если через presence не получилось, делаем API запрос
      try {
        const response = await fetch(`${apiUrl}/public/users/operators?online=true&limit=1`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Ответ от API операторы онлайн:', data);
          
          if (data.operators && data.operators.length > 0) {
            const operator = data.operators[0];
            console.log('Найден онлайн оператор через API:', operator);
            return {
              id: operator._id || operator.id,
              name: operator.profile?.fullName || operator.profile?.username || operator.email || 'Оператор',
              avatar: operator.profile?.avatarUrl,
              isOnline: operator.profile?.isOnline || false
            };
          }
        } else {
          console.warn('Ошибка получения онлайн операторов:', response.status, response.statusText);
        }
      } catch (apiError) {
        console.warn('Ошибка API запроса онлайн операторов:', apiError);
      }
      
      // Если нет онлайн операторов, получаем любого оператора
      try {
        const fallbackResponse = await fetch(`${apiUrl}/public/users/operators?limit=1`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Ответ от API все операторы:', fallbackData);
          
          if (fallbackData.operators && fallbackData.operators.length > 0) {
            const operator = fallbackData.operators[0];
            console.log('Найден оператор (может быть оффлайн):', operator);
            return {
              id: operator._id || operator.id,
              name: operator.profile?.fullName || operator.profile?.username || operator.email || 'Оператор',
              avatar: operator.profile?.avatarUrl,
              isOnline: operator.profile?.isOnline || false
            };
          }
        } else {
          console.warn('Ошибка получения всех операторов:', fallbackResponse.status, fallbackResponse.statusText);
        }
      } catch (fallbackError) {
        console.warn('Ошибка fallback API запроса:', fallbackError);
      }
      
      // Если нет операторов вообще, возвращаем дефолт
      console.log('Операторы не найдены, возвращаем дефолтного');
      return {
        id: 'default_operator',
        name: 'Оператор поддержки',
        avatar: operatorAvatar,
        isOnline: false
      };
    } catch (error) {
      console.error('Критическая ошибка получения оператора:', error);
      return {
        id: 'system_support',
        name: 'Система поддержки',
        avatar: operatorAvatar,
        isOnline: false
      };
    }
  }, [apiUrl, operatorAvatar, presence?.onlineUsers]);

  const handleCreateConversation = useCallback(async () => {
    if (!userToken || isCreatingConversation) {
      console.log('Нет токена пользователя для создания беседы или уже создается');
      return;
    }
    
    setIsCreatingConversation(true);
    try {
      console.log('Получение доступного оператора...');
      const operator = await getAvailableOperator();
      setOperatorInfo(operator);
      
      // Для анонимных пользователей создаем беседу через публичный API
      if (userToken === 'anonymous' || userData?.isAnonymous) {
        console.log('Создание анонимной беседы через публичный API...');
        
        // Генерируем sessionId для анонимного пользователя (UUID формат)
        const sessionId = userData?.sessionId || crypto.randomUUID();
        
        const requestBody = {
          visitorName: userData?.firstName || 'Посетитель',
          visitorEmail: userData?.email || undefined,
          title: 'Обращение с сайта',
          sessionId: sessionId,
          initialMessage: 'Здравствуйте! У меня есть вопрос.'
        };
        
        console.log('Отправляем запрос на создание анонимной беседы:', requestBody);
        
        const response = await createConversation(() => 
          fetch(`${apiUrl}/public/chat/conversations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          }).then(async res => {
            const data = await res.json();
            if (!res.ok) {
              console.error('Ошибка создания анонимной беседы:', res.status, data);
              throw new Error(data.message || `HTTP ${res.status}`);
            }
            return data;
          })
        );
        
        console.log('Ответ создания анонимной беседы:', response);
        
        const conversationData = response.data || response;
        const convId = conversationData.id || conversationData._id;
        
        if (convId) {
          setConversationId(convId);
          
          // Обновляем userData с sessionId
          setUserData(prev => ({
            ...prev,
            sessionId: sessionId
          }));
          
          // Добавляем приветственное сообщение
          const welcomeMsg = {
            id: 'welcome',
            content: `${welcomeMessage} Вас обслуживает ${operator.name}.`,
            timestamp: new Date(),
            sender: 'operator' as const,
            senderName: operator.name,
            type: 'system' as const
          };
          
          console.log('Добавляем приветственное сообщение для анонимного пользователя:', welcomeMsg);
          setMessages([welcomeMsg]);
          setIsConnected(true);
        }
        
        return;
      }
      
      console.log('Создание беседы для авторизованного пользователя...');
      
      // Проверяем, что у нас есть валидный оператор
      if (operator.id === 'system_support' || !operator.id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('В данный момент нет доступных операторов. Попробуйте позже.');
      }
      
      const userId = userData._id || userData.id;
      const requestBody = {
        type: 'user-operator',
        title: 'Обращение с сайта',
        participantIds: [userId, operator.id] // Добавляем текущего пользователя
      };
      
      console.log('Отправляем запрос на создание беседы:', requestBody);
      console.log('ID текущего пользователя:', userId);
      console.log('Данные пользователя:', userData);
      
      const response = await createConversation(() => 
        fetch(`${apiUrl}/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userToken && userToken !== 'anonymous' ? { 'Authorization': `Bearer ${userToken}` } : {})
          },
          body: JSON.stringify(requestBody)
        }).then(async res => {
          const data = await res.json();
          if (!res.ok) {
            console.error('Ошибка создания беседы:', res.status, data);
            throw new Error(data.message || `HTTP ${res.status}`);
          }
          return data;
        })
      );
      
      console.log('Ответ создания беседы:', response);
      
      // Проверяем если это правильная структура ответа
      if (response && (response.success || response.data || response.id || response._id)) {
        const conversationData = response.data || response;
        const convId = conversationData.id || conversationData._id;
        
        if (convId) {
          setConversationId(convId);
          
          // Добавляем приветственное сообщение
          const welcomeMsg = {
            id: 'welcome',
            content: `${welcomeMessage} Вас обслуживает ${operator.name}.`,
            timestamp: new Date(),
            sender: 'operator' as const,
            senderName: operator.name,
            type: 'system' as const
          };
          
          console.log('Добавляем приветственное сообщение:', welcomeMsg);
          setMessages([welcomeMsg]);
          
          setIsConnected(true);
        } else {
          console.error('Нет ID беседы в ответе:', response);
        }
      } else {
        console.error('Некорректная структура ответа создания беседы:', response);
      }
    } catch (error) {
      console.error('Ошибка создания беседы:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  }, [userToken, isCreatingConversation, apiUrl, createConversation, welcomeMessage, getAvailableOperator, userData]);

  const checkExistingAuth = useCallback(async () => {
    // Сначала проверяем токены основного приложения
    const appToken = getCookie('access_token') || localStorage.getItem('access_token');
    const appUserData = localStorage.getItem('user_data');
    
    // Потом проверяем токены виджета
    const widgetToken = getCookie('chat_widget_token');
    const widgetUserData = getCookie('chat_widget_user');
    
    console.log('Проверка авторизации:', { appToken: !!appToken, widgetToken: !!widgetToken, appUserData: !!appUserData, widgetUserData: !!widgetUserData });
    
    const token = appToken || widgetToken;
    let localUserData = null;
    
    // Если уже авторизован, не проверяем снова
    if (userToken && userData && userData.id) {
      return;
    }
    
    if (appUserData) {
      try {
        localUserData = JSON.parse(appUserData);
        console.log('Данные пользователя из основного приложения:', userData);
      } catch (e) {
        console.error('Ошибка парсинга данных пользователя из основного приложения:', e);
      }
    } else if (widgetUserData) {
      try {
        localUserData = JSON.parse(decodeURIComponent(widgetUserData));
        console.log('Данные пользователя виджета:', userData);
      } catch (e) {
        console.error('Ошибка парсинга данных пользователя виджета:', e);
      }
    }
    
    if (token && token !== 'anonymous') {
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
          
          // Update auth store for socket connection
          if (data.user.role !== 'VISITOR') {
            setAuth(token, data.user);
          }
          
          // Синхронизируем токены между приложением и виджетом
          if (appToken && !widgetToken) {
            console.log('Синхронизация токенов основного приложения с виджетом');
            setCookie('chat_widget_token', token);
            setCookie('chat_widget_user', encodeURIComponent(JSON.stringify(data.user)));
          }
          
          return; // Успешная авторизация
        } else {
          console.log('Токен недействителен, переходим в анонимный режим');
          // Очищаем недействительные токены
          if (appToken) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
            setCookie('access_token', '', -1);
          }
          if (widgetToken) {
            setCookie('chat_widget_token', '', -1);
            setCookie('chat_widget_user', '', -1);
          }
          clearAuth();
        }
      } catch (error) {
        console.log('Ошибка проверки токена, переходим в анонимный режим:', error);
        clearAuth();
      }
    }
    
    // Анонимный режим - создаем временного пользователя
    console.log('Создание анонимного пользователя для виджета');
    const anonymousUserId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = crypto.randomUUID();
    const anonymousUser = {
      id: anonymousUserId,
      _id: anonymousUserId,
      email: `anonymous@widget.temp`,
      firstName: 'Посетитель',
      lastName: 'Сайта',
      role: 'VISITOR',
      isAnonymous: true,
      sessionId: sessionId
    };
    
    setUserData(anonymousUser);
    setUserToken('anonymous'); // Специальный токен для анонимных пользователей
    setIsAuthenticated(false);
  }, [apiUrl, userToken, userData]);

  // Sync with auth store (только если нет локальных данных)
  useEffect(() => {
    if (!userToken && !userData) {
      setIsAuthenticated(authIsAuthenticated);
      setUserToken(authToken);
      setUserData(authUser);
    }
  }, [authIsAuthenticated, authToken, authUser, userToken, userData]);

  useEffect(() => {
    let isMounted = true;
    
    // Проверяем авторизацию только один раз при монтировании
    if (!userToken && !userData) {
      checkExistingAuth();
    }
    
    // Слушаем изменения в localStorage для синхронизации с основным приложением
    const handleStorageChange = (e: StorageEvent) => {
      if (isMounted && (e.key === 'access_token' || e.key === 'user_data')) {
        console.log('Изменение в localStorage:', e.key, e.newValue);
        if (!userToken && !userData) {
          checkExistingAuth();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [apiUrl]); // Убираем зависимости checkExistingAuth, userToken, userData

  useEffect(() => {
    if (isOpen && userToken && !conversationId && !isCreatingConversation) {
      handleCreateConversation();
    }
  }, [isOpen, userToken, conversationId, isCreatingConversation]);

  useEffect(() => {
    if (conversationId && userToken && userToken !== 'anonymous' && socketConnected) {
      console.log('Подключение к WebSocket для беседы:', conversationId);
      
      // Подключаемся к WebSocket и присоединяемся к комнате беседы
      emitSocketEvent('join-room', { conversationId });
      // Запрашиваем кэшированные сообщения
      emitSocketEvent('get-cached-messages', { conversationId, limit: 50 });
    }
  }, [conversationId, userToken, socketConnected, emitSocketEvent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || !userToken) return;
    
    const messageText = inputMessage;
    const tempId = `temp_${Date.now()}`;
    
    // Добавляем сообщение локально сразу для лучшего UX
    const newMessage: Message = {
      id: tempId,
      content: messageText,
      timestamp: new Date(),
      sender: 'user',
      type: 'text'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // Для анонимных пользователей - отправка через публичный API
    if (userToken === 'anonymous' || userData?.isAnonymous) {
      console.log('Отправка анонимного сообщения:', messageText);
      
      try {
        const response = await sendMessage(() => 
          fetch(`${apiUrl}/public/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: messageText,
              type: 'text',
              sessionId: userData?.sessionId,
              senderName: userData?.firstName || 'Посетитель'
            })
          }).then(res => res.json())
        );
        
        console.log('Ответ отправки анонимного сообщения:', response);
        
        if (response.success) {
          // Обновляем локальное сообщение с реальным ID
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, id: response.data.id || response.data._id }
              : msg
          ));
        } else {
          // Удаляем сообщение в случае ошибки
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          console.error('Ошибка отправки анонимного сообщения:', response.error);
        }
      } catch (error) {
        console.error('Ошибка отправки анонимного сообщения:', error);
        // Удаляем сообщение в случае ошибки
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
      return;
    }
    
    // Для авторизованных пользователей - отправка через Socket.IO
    try {
      console.log('Отправка сообщения через Socket.IO:', messageText);
      
      if (socketConnected) {
        // Отправляем сообщение через WebSocket
        emitSocketEvent('send-message', {
          conversationId,
          text: messageText,
          type: 'text',
          tempId
        });
      } else {
        // Fallback - отправка через HTTP API если нет WebSocket соединения
        console.log('WebSocket не подключен, отправка через HTTP API');
        
        const response = await sendMessage(() => 
          fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(userToken && userToken !== 'anonymous' ? { 'Authorization': `Bearer ${userToken}` } : {})
            },
            body: JSON.stringify({
              text: messageText,
              type: 'text'
            })
          }).then(res => res.json())
        );
        
        console.log('Ответ HTTP отправки сообщения:', response);
        
        if (response.success) {
          // Обновляем локальное сообщение с реальным ID
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, id: response.data.id || response.data._id }
              : msg
          ));
        } else {
          // Удаляем сообщение в случае ошибки
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          console.error('Ошибка отправки сообщения через HTTP:', response.error);
        }
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      // Удаляем сообщение в случае ошибки
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
            ...(userToken && userToken !== 'anonymous' ? { 'Authorization': `Bearer ${userToken}` } : {})
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
      const shouldLogin = confirm('Для оценки работы оператора необходимо войти в систему. Открыть форму входа?');
      if (shouldLogin) {
        setAuthModalMode('login');
        setShowAuthModal(true);
      }
      setShowRatingModal(false);
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && userToken !== 'anonymous' ? { Authorization: `Bearer ${userToken}` } : {})
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
      const shouldLogin = confirm('Для подачи жалобы необходимо войти в систему. Открыть форму входа?');
      if (shouldLogin) {
        setAuthModalMode('login');
        setShowAuthModal(true);
      }
      setShowComplaintModal(false);
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && userToken !== 'anonymous' ? { Authorization: `Bearer ${userToken}` } : {})
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
            ...(userToken && userToken !== 'anonymous' ? { 'Authorization': `Bearer ${userToken}` } : {})
          }
        });
      } catch (error) {
        console.error('Ошибка выхода:', error);
      }
    }
    
    // Очищаем все данные состояния
    clearAuth();
    setConversationId(null);
    setOperatorInfo(null);
    setMessages([{
      id: Date.now().toString(),
      content: 'Вы вышли из системы',
      timestamp: new Date(),
      sender: 'operator',
      type: 'system'
    }]);
  };

  const toggleWidget = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else if (!isOpen) {
      setIsOpen(true);
    }
    if (onClose && isOpen && !isMinimized) onClose();
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

  if (!isOpen || isMinimized) {
    return (
      <div className={`${positionClasses[position]} z-50`}>
        <Button
          onClick={toggleWidget}
          className="rounded-full h-16 shadow-lg hover:shadow-xl transition-shadow flex items-center pr-4 pl-4"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-8 h-8" />
          {(!isOpen || isMinimized) && (
            <span className="ml-1 text-white text-sm whitespace-nowrap">
              Написать сообщение
            </span>
          )}
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
                  <User className="w-4 h-4 ml-2 mt-2" />
                )}
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-white text-sm">
                  {isAuthenticated && userData ? 
                    'Чат поддержки' : 
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
                  {isAuthenticated ? 'Авторизован' : (isConnected ? 'В сети' : 'Не в сети')}
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
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
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
              
              {allowRating && operatorInfo && isAuthenticated && (
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
              
              {allowComplaint && operatorInfo && isAuthenticated && (
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onAuthSuccess={(token, user) => {
          saveAuth(token, user);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};

export default ChatWidget;