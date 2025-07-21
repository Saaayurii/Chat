"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const [conversationId, setConversationId] = useState<string | null>(() => {
    // Восстанавливаем conversationId из localStorage при инициализации
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_widget_conversation_id');
    }
    return null;
  });
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
  // Стабилизируем userId чтобы избежать переподключений
  const stableUserId = useMemo(() => {
    if (userData?._id) return userData._id;
    if (userData?.id) return userData.id;
    return 'anonymous';
  }, [userData?._id, userData?.id]);

  // Мемоизируем параметры presence для стабильности и отключаем для виджета
  const presenceConfig = useMemo(() => ({
    apiUrl: apiUrl || '',
    userId: stableUserId,
    token: userToken || undefined,
    autoConnect: false, // Отключаем presence в виджете чтобы избежать конфликтов
    enableCrossTabSync: false
  }), [apiUrl, stableUserId, userToken]);

  const presence = usePresence(presenceConfig);
  
  // WebSocket подключение для всех пользователей
  const shouldUseWebSocket = !!userToken; // Подключаемся для всех пользователей
  
  console.log('ChatWidget WebSocket состояние:', {
    userToken, 
    shouldUseWebSocket, 
    isAnonymous: userData?.isAnonymous
  });
  
  const socketHook = useSocketIO('/chat', {
    autoConnect: shouldUseWebSocket,
    isAnonymous: userToken === 'anonymous' || userData?.isAnonymous,
    sessionId: userData?.sessionId,
    onMessage: (message) => {
      console.log('Получено сообщение через WebSocket:', message);
      
      if (message.type === 'new_message') {
          // Определяем отправителя аналогично логике для загруженных сообщений
          const isOperatorMessage = message.data.senderId === operatorInfo?.id || 
                                  message.data.isSystemMessage ||
                                  message.data.senderName?.includes('Оператор') ||
                                  message.data.senderName === 'Система';
          
          const newMessage: Message = {
          id: message.data.id || Date.now().toString(),
          content: message.data.text || message.data.content,
          timestamp: new Date(message.data.timestamp),
          sender: isOperatorMessage ? 'operator' : 'user',
          senderName: message.data.senderName || operatorName,
          type: message.data.isSystemMessage ? 'system' : (message.data.type || 'text')
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
        const cachedMessages = ((message as any).messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.text,
          timestamp: new Date(msg.timestamp),
          sender: msg.senderId === (userData?._id || userData?.id) ? 'user' : 'operator',
          senderName: msg.senderName || operatorName,
          type: msg.type || 'text'
        }));
        
        setMessages(prev => [...cachedMessages, ...prev]);
        console.log('Загружены кэшированные сообщения:', cachedMessages.length, 'из', (message as any).source);
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
    }
  });

  // Извлекаем функции из socketHook
  const { isConnected: socketConnected, emit: emitSocketEvent, on: onSocketEvent, off: offSocketEvent } = socketHook;
  
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
    localStorage.removeItem('chat_widget_conversation_id'); // Очищаем сохраненную беседу
    
    // Обновляем auth store
    setAuth(null as any, null as any);
    
    // Сбрасываем состояние беседы
    setConversationId(null);
    setMessages([]);
    setIsConnected(false);
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
          (user as any).role === 'operator' || (user as any).role === 'admin'
        );
        
        if (onlineOperators.length > 0) {
          const operator = onlineOperators[0];
          console.log('Найден онлайн оператор через presence:', operator);
          return {
            id: operator.userId,
            name: (operator as any).displayName || 'Оператор',
            avatar: (operator as any).avatar,
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
    
    // Для авторизованных пользователей ждем загрузки userData
    if (userToken !== 'anonymous' && !userData) {
      console.log('Ожидание загрузки данных пользователя...');
      return;
    }
    
    setIsCreatingConversation(true);
    try {
      console.log('Получение доступного оператора...');
      const operator = await getAvailableOperator();
      setOperatorInfo(operator);
      
      // Используем публичный API для всех пользователей - это упрощает логику
      console.log('Создание беседы через публичный API для всех типов пользователей...');
      
      // Определяем данные пользователя
      const isAnonymous = userToken === 'anonymous' || !userData?.id;
      const sessionId = userData?.sessionId || crypto.randomUUID();
      const userName = userData?.profile?.fullName || userData?.profile?.username || userData?.firstName || 'Посетитель';
      const userEmail = userData?.email;
      
      console.log('User data for conversation:', { isAnonymous, userName, userEmail, userData, userToken });
        
        const requestBody = {
          visitorName: userName,
          visitorEmail: userEmail,
          title: 'Обращение с сайта',
          sessionId: sessionId,
          initialMessage: 'Здравствуйте! У меня есть вопрос.',
          // Передаем дополнительную информацию если пользователь авторизован
          ...((!isAnonymous && (userData?.id || userData?._id)) && {
            userId: userData?.id || userData?._id,
            userRole: userData?.role
          })
        };
        
        console.log('Отправляем запрос на создание беседы:', requestBody);
        
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
          // Сохраняем conversationId в localStorage для восстановления после обновления страницы
          localStorage.setItem('chat_widget_conversation_id', convId);
          
          // Получаем информацию о назначенном операторе из ответа сервера
          const assignedOperator = conversationData.assignedOperator;
          const operatorName = assignedOperator 
            ? (assignedOperator.profile?.fullName || assignedOperator.profile?.username || assignedOperator.email || 'Оператор')
            : operator.name;
          
          console.log('Назначенный оператор:', assignedOperator);
          console.log('Имя оператора:', operatorName);
          
          // Обновляем информацию об операторе с реальными данными
          setOperatorInfo({
            id: assignedOperator?._id || assignedOperator?.id || operator.id,
            name: operatorName,
            avatar: assignedOperator?.profile?.avatarUrl || operator.avatar,
            isOnline: assignedOperator ? true : operator.isOnline // Если оператор назначен, считаем его онлайн
          });
          
          // Обновляем userData с sessionId
          setUserData((prev: any) => ({
            ...prev,
            sessionId: sessionId
          }));
          
          // Добавляем приветственное сообщение с именем реального назначенного оператора
          const welcomeMsg = {
            id: 'welcome',
            content: `${welcomeMessage} Вас обслуживает ${operatorName}.`,
            timestamp: new Date(),
            sender: 'operator' as const,
            senderName: operatorName,
            type: 'system' as const
          };
          
          console.log('Добавляем приветственное сообщение:', welcomeMsg);
          setMessages([welcomeMsg]);
          setIsConnected(true);
        }
        
        return;
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
    
    console.log('Selected token:', token);
    
    // Если уже авторизован, не проверяем снова
    if (userToken && userData && userData.id) {
      return;
    }
    
    if (appUserData) {
      try {
        localUserData = JSON.parse(appUserData);
        console.log('Данные пользователя из основного приложения:', localUserData);
      } catch (e) {
        console.error('Ошибка парсинга данных пользователя из основного приложения:', e);
      }
    } else if (widgetUserData) {
      try {
        localUserData = JSON.parse(decodeURIComponent(widgetUserData));
        console.log('Данные пользователя виджета:', localUserData);
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
          console.log('Token used for /auth/me:', token);
          
          console.log('Устанавливаем userData из /auth/me:', data.user);
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

  // Восстановление сообщений при наличии сохраненной беседы
  useEffect(() => {
    const restoreConversation = async () => {
      if (conversationId && userToken && !messages.length) {
        try {
          console.log('Восстановление беседы:', conversationId);
          
          // Получаем сообщения беседы
          const response = await fetch(`${apiUrl}/public/chat/conversations/${conversationId}/messages?limit=50`);
          if (response.ok) {
            const data = await response.json();
            const conversationMessages = data.messages || data;
            
            if (Array.isArray(conversationMessages) && conversationMessages.length > 0) {
              const formattedMessages = conversationMessages.map((msg: any) => {
                // Определяем отправителя по ID оператора или по системным сообщениям
                const isOperatorMessage = msg.senderId === operatorInfo?.id || 
                                        msg.isSystemMessage ||
                                        msg.senderName?.includes('Оператор') ||
                                        msg.senderName === 'Система';
                
                return {
                  id: msg._id || msg.id,
                  content: msg.text || msg.content,
                  timestamp: new Date(msg.createdAt || msg.timestamp),
                  sender: isOperatorMessage ? 'operator' : 'user',
                  senderName: msg.senderName || 'Неизвестный',
                  type: msg.isSystemMessage ? 'system' : 'text'
                };
              });
              
              setMessages(formattedMessages.reverse()); // Сообщения приходят в обратном порядке
              setIsConnected(true);
              console.log('Восстановлено сообщений:', formattedMessages.length);
            }
          }
          
          // Получаем информацию о беседе для отображения оператора и восстановления sessionId
          const conversationResponse = await fetch(`${apiUrl}/public/chat/conversations/${conversationId}`);
          if (conversationResponse.ok) {
            const conversationData = await conversationResponse.json();
            const assignedOperator = conversationData.assignedOperator;
            
            // Восстанавливаем sessionId из данных беседы если он есть
            if (conversationData.anonymousUser?.sessionId) {
              setUserData(prev => ({
                ...prev,
                sessionId: conversationData.anonymousUser.sessionId
              }));
              console.log('Восстановлен sessionId из беседы:', conversationData.anonymousUser.sessionId);
            }
            
            if (assignedOperator) {
              const operatorName = assignedOperator.profile?.fullName || assignedOperator.profile?.username || assignedOperator.email || 'Оператор';
              setOperatorInfo({
                id: assignedOperator._id || assignedOperator.id,
                name: operatorName,
                avatar: assignedOperator.profile?.avatarUrl,
                isOnline: true
              });
            }
          }
        } catch (error) {
          console.error('Ошибка восстановления беседы:', error);
          // Если беседа не найдена или недоступна, очищаем ID
          setConversationId(null);
          localStorage.removeItem('chat_widget_conversation_id');
        }
      }
    };

    restoreConversation();
  }, [conversationId, userToken, apiUrl, messages.length, operatorInfo?.id]);

  useEffect(() => {
    // Для анонимных пользователей можно создавать беседу без userData
    const canCreateConversation = userToken && !conversationId && !isCreatingConversation && 
                                 (userToken === 'anonymous' || userData);
                                 
    if (isOpen && canCreateConversation) {
      handleCreateConversation();
    }
  }, [isOpen, userToken, userData, conversationId, isCreatingConversation, handleCreateConversation]);

  useEffect(() => {
    if (conversationId && userToken && socketConnected) {
      console.log('Подключение к WebSocket для беседы:', conversationId);
      
      // Подключаемся к WebSocket и присоединяемся к комнате беседы
      emitSocketEvent('join-room', { conversationId });
      // Запрашиваем кэшированные сообщения
      emitSocketEvent('get-cached-messages', { conversationId, limit: 50 });
    }
  }, [conversationId, userToken, socketConnected, emitSocketEvent]);

  // Отмечаем сообщения как прочитанные когда виджет открыт
  useEffect(() => {
    if (isOpen && conversationId && messages.length > 0) {
      const markMessagesAsRead = async () => {
        try {
          // Для авторизованных пользователей используем защищенный endpoint
          if (userToken && userToken !== 'anonymous') {
            const response = await fetch(`${apiUrl}/chat/conversations/${conversationId}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('chat_widget_token')}`
              }
            });

            if (response.ok) {
              console.log('Сообщения отмечены как прочитанные (авторизованный пользователь)');
            }
          } else {
            // Для анонимных пользователей используем публичный endpoint
            const response = await fetch(`${apiUrl}/public/chat/conversations/${conversationId}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                sessionId: userData?.sessionId || getUserId()
              })
            });

            if (response.ok) {
              console.log('Сообщения отмечены как прочитанные (анонимный пользователь)');
            } else {
              console.warn('Не удалось отметить сообщения как прочитанные для анонимного пользователя');
            }
          }
        } catch (error) {
          console.warn('Не удалось отметить сообщения как прочитанные:', error);
          // Не критично, продолжаем работу
        }
      };

      // Отмечаем через небольшую задержку, чтобы пользователь успел увидеть сообщения
      const timer = setTimeout(markMessagesAsRead, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, conversationId, messages.length, apiUrl, userToken]);

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
    
    // Диагностика состояния пользователя
    console.log('Состояние пользователя:', {
      userToken,
      isAnonymous: userData?.isAnonymous,
      hasUserId: !!userData?.id,
      userData,
      oldCondition: userToken === 'anonymous' || userData?.isAnonymous,
      newCondition: userToken === 'anonymous' || userData?.isAnonymous || !userData?.id
    });

    // Определяем, является ли пользователь анонимным
    const isAnonymousUser = userToken === 'anonymous' || userData?.isAnonymous || !userData?.id;
    
    // Для анонимных пользователей - отправка через публичный API
    if (isAnonymousUser) {
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
    console.log('Переходим к авторизованной ветке:', {isAnonymousUser, userToken, userData});
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
        
        // Выбираем правильный endpoint - для ChatWidget всегда используем публичный API
        // поскольку беседы создаются как анонимные даже для авторизованных пользователей
        const endpoint = `${apiUrl}/public/chat/conversations/${conversationId}/messages`;
        
        const headers = {
          'Content-Type': 'application/json'
        };

        const body = JSON.stringify({
          text: messageText,
          sessionId: userData?.sessionId || getUserId(),
          senderName: userData?.profile?.fullName || userData?.firstName || 'Посетитель'
        });

        const response = await sendMessage(() => 
          fetch(endpoint, {
            method: 'POST',
            headers,
            body
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