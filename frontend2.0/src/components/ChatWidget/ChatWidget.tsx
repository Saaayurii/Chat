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
        setOperatorInfo((prev: any) => ({
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
        emitSocketEvent('join-room', { conversationId });
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
    autoConnect: userToken ? true : false
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
    deleteCookie('chat_widget_token');
    deleteCookie('chat_widget_user');
  };

  const handleGuestRegistration = useCallback(async () => {
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
          console.log('Гостевой токен валиден, пользователь авторизован');
          return;
        } else {
          // Токен недействителен, удаляем его
          deleteCookie('chat_widget_guest_token');
          console.log('Гостевой токен недействителен, удаляем');
        }
      } catch (error) {
        console.error('Ошибка проверки гостевого токена:', error);
        deleteCookie('chat_widget_guest_token');
      }
    }

    // Создаем нового гостя
    try {
      const guestId = getCookie('chat_widget_guest_id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCookie('chat_widget_guest_id', guestId, 365);
      
      const registrationData = {
        email: `${guestId}@widget.guest`,
        password: `${guestId}_${Date.now()}`,
        firstName: 'Посетитель',
        lastName: 'Сайта',
        role: 'VISITOR'
      };

      console.log('Регистрация нового гостя:', registrationData.email);

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      
      const data = await response.json();
      console.log('Ответ регистрации:', data);
      
      if (data.success || data.accessToken) { // некоторые API возвращают accessToken напрямую
        const token = data.accessToken || data.token || data.data?.token;
        const user = data.user || data.data?.user || { ...registrationData, id: Date.now().toString(), role: 'VISITOR' };
        
        setUserToken(token);
        setUserData(user);
        setCookie('chat_widget_guest_token', token, 30);
        console.log('Гость успешно зарегистрирован');
      } else {
        console.error('Ошибка регистрации посетителя:', data);
      }
    } catch (error) {
      console.error('Ошибка регистрации посетителя:', error);
    }
  }, [apiUrl]);

  const getAvailableOperator = useCallback(async () => {
    try {
      // Сначала пытаемся получить онлайн операторов
      const response = await fetch(`${apiUrl}/public/users/operators?online=true&limit=1`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.operators && data.operators.length > 0) {
          const operator = data.operators[0];
          console.log('Найден онлайн оператор:', operator);
          return {
            id: operator._id || operator.id,
            name: operator.profile?.fullName || operator.profile?.username || operator.email,
            avatar: operator.profile?.avatarUrl,
            isOnline: true
          };
        }
      }
      
      // Если нет онлайн операторов, получаем любого оператора
      const fallbackResponse = await fetch(`${apiUrl}/public/users/operators?limit=1`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.operators && fallbackData.operators.length > 0) {
          const operator = fallbackData.operators[0];
          console.log('Найден оператор (оффлайн):', operator);
          return {
            id: operator._id || operator.id,
            name: operator.profile?.fullName || operator.profile?.username || operator.email,
            avatar: operator.profile?.avatarUrl,
            isOnline: false
          };
        }
      }
      
      // Если нет операторов вообще, возвращаем дефолт
      return {
        id: 'default_operator',
        name: 'Оператор поддержки',
        avatar: operatorAvatar,
        isOnline: false
      };
    } catch (error) {
      console.error('Ошибка получения оператора:', error);
      return {
        id: 'system_support',
        name: 'Система поддержки',
        avatar: operatorAvatar,
        isOnline: false
      };
    }
  }, [apiUrl, operatorAvatar]);

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
      
      // Для анонимных пользователей создаем локальную беседу
      if (userToken === 'anonymous' || userData?.isAnonymous) {
        console.log('Создание анонимной беседы...');
        const anonymousConversationId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setConversationId(anonymousConversationId);
        
        // Добавляем приветственное сообщение
        const welcomeMsg = {
          id: 'welcome',
          content: `${welcomeMessage} Вас обслуживает ${operator.name}. Ваши сообщения будут переданы оператору.`,
          timestamp: new Date(),
          sender: 'operator' as const,
          senderName: operator.name,
          type: 'system' as const
        };
        
        console.log('Добавляем приветственное сообщение для анонимного пользователя:', welcomeMsg);
        setMessages([welcomeMsg]);
        setIsConnected(true);
        return;
      }
      
      console.log('Создание беседы для авторизованного пользователя...');
      
      // Проверяем, что у нас есть валидный оператор
      if (operator.id === 'system_support' || !operator.id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('В данный момент нет доступных операторов. Попробуйте позже.');
      }
      
      const requestBody = {
        type: 'user-operator',
        title: 'Обращение с сайта',
        participantIds: [userData.id, operator.id] // Добавляем текущего пользователя
      };
      
      console.log('Отправляем запрос на создание беседы:', requestBody);
      
      const response = await createConversation(() => 
        fetch(`${apiUrl}/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
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
      
      if (response.success || response.data || response.id) {
        const conversationData = response.data || response;
        setConversationId(conversationData.id || conversationData._id);
        
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
        console.error('Ошибка создания беседы:', response.error || response);
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
    const anonymousUser = {
      id: `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `anonymous@widget.temp`,
      firstName: 'Анонимный',
      lastName: 'Пользователь',
      role: 'VISITOR',
      isAnonymous: true
    };
    
    setUserData(anonymousUser);
    setUserToken('anonymous'); // Специальный токен для анонимных пользователей
    setIsAuthenticated(false);
  }, [apiUrl, userToken, userData]);

  // Sync with auth store
  useEffect(() => {
    setIsAuthenticated(authIsAuthenticated);
    setUserToken(authToken);
    setUserData(authUser);
  }, [authIsAuthenticated, authToken, authUser]);

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
    // Но только если пользователь не авторизован
    const interval = setInterval(() => {
      if (!userToken || !userData || !userData.id) {
        checkExistingAuth();
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [apiUrl, checkExistingAuth, userToken, userData]);

  useEffect(() => {
    if (isOpen && userToken && !conversationId && !isCreatingConversation) {
      handleCreateConversation();
    }
  }, [isOpen, userToken, conversationId, isCreatingConversation]);

  useEffect(() => {
    if (conversationId && userToken) {
      console.log('Подключение к WebSocket для беседы:', conversationId);
      
      // Подключаемся к WebSocket и присоединяемся к комнате беседы
      if (socketConnected) {
        emitSocketEvent('join-room', { conversationId });
      }
    }
  }, [conversationId, userToken, socketConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    
    // Для анонимных пользователей - только локальное сохранение и имитация ответа
    if (userToken === 'anonymous' || userData?.isAnonymous) {
      console.log('Отправка анонимного сообщения:', messageText);
      
      // Имитируем ответ оператора через несколько секунд
      setTimeout(() => {
        const operatorResponse: Message = {
          id: Date.now().toString(),
          content: 'Спасибо за ваше сообщение! Ваш вопрос передан оператору. Для полноценного общения рекомендуем авторизоваться.',
          timestamp: new Date(),
          sender: 'operator',
          senderName: operatorInfo?.name || operatorName,
          type: 'text'
        };
        
        setMessages(prev => [...prev, operatorResponse]);
      }, 1500);
      return;
    }
    
    // Для авторизованных пользователей - отправка на сервер
    try {
      console.log('Отправка сообщения авторизованного пользователя:', messageText);
      
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
          emitSocketEvent('send-message', {
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
            senderName: operatorInfo?.name || operatorName,
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
                    (userData.fullName || userData.username) : 
                    `${operatorName}${operatorInfo?.name ? ` (${operatorInfo.name})` : ''}`
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