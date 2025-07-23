"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Wifi,
  WifiOff,
  User,
  Phone,
  Mail,
  Shield,
  Globe,
  UserX,
  ArrowRightLeft,
  Bell,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { chatAPI } from "@/core/api";
import { useChat } from "@/hooks/useChat";
import { useUnreadMessages } from "@/contexts/UnreadMessagesContext";
import { User as UserType, UserRole } from "@/types";
import TransferModal from "@/components/Chat/TransferModal";
import BlockUserModal from "@/components/Chat/BlockUserModal";
import TransferRequestModal from "@/components/Chat/TransferRequestModal";
import ProtectedRoute from "@/components/ProtectedRoute";

interface SenderType {
  id: string;
  name: string;
  type: "operator" | "visitor";
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
import * as Radix from "@radix-ui/themes";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/Avatar";
import { Badge } from "@/components/UI";
import Button from "@/components/UI/Button";
import {
  PresenceIndicator,
  PresenceAvatar,
  OnlineUsersList,
  PresenceStatus,
  usePresence,
} from "@/components/Presence";

const OperatorChatPageContent = () => {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleMessagesRef = useRef<Set<string>>(new Set());
  const updateConversationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSender, setSelectedSender] = useState<SenderType | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [transferRequest, setTransferRequest] = useState<any>(null);
  const [showTransferRequestModal, setShowTransferRequestModal] =
    useState(false);
  
  // Состояние для пагинации диалогов
  const [displayedDialogsCount, setDisplayedDialogsCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // WebSocket chat hook
  const {
    isConnected,
    isConnecting,
    wsError,
    typingUsers,
    sendChatMessage,
    setTyping,
    joinConversation,
    leaveConversation,
    markAsRead,
    markConversationAsRead,
    reconnect,
  } = useChat();

  // Используем контекст для обновления глобального счетчика
  const { updateUnreadCount } = useUnreadMessages();

  // Логирование для отслеживания перерендеров
  console.log(
    `[${new Date().toISOString()}] OperatorChatPageContent: Component rendered, user: ${
      user?.id || "none"
    }, token: ${!!token}`
  );
  console.log(
    `[${new Date().toISOString()}] OperatorChatPageContent: Selected conversation: ${selectedConversation}, isConnected: ${isConnected}`
  );

  // Принудительно обновляем список разговоров при подключении WebSocket
  useEffect(() => {
    if (isConnected) {
      console.log('WebSocket connected, invalidating conversations');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Также обновляем каждые 10 секунд для получения новых диалогов
      const interval = setInterval(() => {
        console.log('Periodic conversation refresh');
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isConnected, queryClient]);

  // Presence system for operator - временно отключаем для отладки
  const presence = {
    onlineUsers: [],
    isConnected: false,
    status: "offline" as const,
  };
  // const presence = usePresence({
  //   apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  //   userId: user?.id || 'anonymous',
  //   token: token || undefined,
  //   autoConnect: !!user,
  //   enableCrossTabSync: true
  // });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await chatAPI.getConversations();
      // Логируем каждую беседу с ее unreadMessagesCount
      response.data?.forEach((conv: any) => {
      });
      return response.data;
    },
    enabled: !!user && !!token,
    refetchInterval: 5000, // Обновляем каждые 5 секунд для быстрого отображения новых диалогов
    refetchOnWindowFocus: true, // Включаем автообновление при фокусе
    staleTime: 1000, // Данные считаются свежими 1 секунду для быстрого обновления
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversation],
    queryFn: async () => {
      if (
        !selectedConversation ||
        !selectedConversation.match(/^[0-9a-fA-F]{24}$/)
      ) {
        console.warn(
          "Invalid conversation ID for messages:",
          selectedConversation
        );
        return null;
      }

      console.log(
        "Getting messages for conversation:",
        selectedConversation
      );
      const response = await chatAPI.getMessages(selectedConversation);
      return response.data;
    },
    enabled:
      !!selectedConversation &&
      !!selectedConversation.match(/^[0-9a-fA-F]{24}$/) &&
      !!conversations,
    refetchInterval: 30000, // Обновляем сообщения каждые 30 секунд
    refetchOnWindowFocus: false, // Убираем автообновление при фокусе
    staleTime: 15000, // Данные считаются свежими 15 секунд
  });

  // Получаем pending transfer requests
  const { data: transferRequests } = useQuery({
    queryKey: ["transfer-requests", "pending"],
    queryFn: async () => {
      const response = await chatAPI.getPendingTransferRequests();
      return response.data;
    },
    enabled: !!user && !!token,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Находим беседу для определения типа
    const conversation = conversations?.find(
      (conv) =>
        conv._id === selectedConversation ||
        (conv as any).id === selectedConversation
    );

    // Отправляем через Socket.IO
    console.log('Sending message:', { selectedConversation, newMessage, isConnected });
    const success = sendChatMessage(selectedConversation, newMessage);
    console.log('Message send result:', success);

    if (success) {
      // Оптимистично добавляем сообщение в локальный кэш
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        id: `temp_${Date.now()}`,
        text: newMessage,
        content: newMessage,
        senderId: user?.id || '',
        conversationId: selectedConversation,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent',
        senderRole: user?.role || 'operator',
        senderName: user?.profile?.fullName || user?.profile?.username || 'Я',
        readBy: [user?.id || ''],
        isRead: false, // Новое сообщение считается непрочитанным
        readTimestamps: {}
      };

      // Добавляем в кэш сразу
      queryClient.setQueryData(
        ['messages', selectedConversation],
        (oldData: any) => {
          if (!oldData) {
            return { data: [tempMessage], total: 1 };
          }
          
          // Проверяем разные форматы данных
          let messages = [];
          if (oldData.data && Array.isArray(oldData.data)) {
            messages = oldData.data;
          } else if (oldData.messages && Array.isArray(oldData.messages)) {
            messages = oldData.messages;
          } else if (Array.isArray(oldData)) {
            messages = oldData;
          }
          
          const newMessages = [...messages, tempMessage];
          
          // Возвращаем в том же формате, что было
          if (oldData.data) {
            return {
              ...oldData,
              data: newMessages
            };
          } else if (oldData.messages) {
            return {
              ...oldData,
              messages: newMessages
            };
          } else {
            return newMessages;
          }
        }
      );

      setNewMessage("");
      setIsTyping(false);
      setTyping(selectedConversation, false);

      // Очищаем таймер печатания
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } else {
      console.error('Failed to send message - Socket not connected or other error');
    }
  }, [newMessage, selectedConversation, sendChatMessage, setTyping, queryClient, user?.id, user?.role, user?.profile?.fullName, user?.profile?.username]);

  const handleMessageChange = useCallback(
    (value: string) => {
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
    },
    [selectedConversation, isTyping, setTyping]
  );

  // Функция для загрузки дополнительных диалогов
  const loadMoreDialogs = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    // Имитируем задержку загрузки
    setTimeout(() => {
      setDisplayedDialogsCount(prev => prev + 10);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore]);

  // Обработчик скролла для infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Если докрутили почти до конца (осталось меньше 100px)
    if (scrollHeight - scrollTop - clientHeight < 100 && !isLoadingMore) {
      loadMoreDialogs();
    }
  }, [loadMoreDialogs, isLoadingMore]);

  // Дебаунсированное обновление списка диалогов
  const updateConversationsList = useCallback((conversationId: string) => {
    // Очищаем предыдущий таймер
    if (updateConversationsTimeoutRef.current) {
      clearTimeout(updateConversationsTimeoutRef.current);
    }
    
    // Устанавливаем новый таймер для отложенного обновления
    updateConversationsTimeoutRef.current = setTimeout(() => {
      queryClient.setQueryData(
        ['conversations'],
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((conv: any) => 
            conv._id === conversationId || conv.id === conversationId ? {
              ...conv,
              unreadMessagesCount: 0
            } : conv
          );
        }
      );
    }, 1000); // Обновляем список только через 1 секунду после последнего изменения
  }, [queryClient]);

  // Функция для создания Intersection Observer
  const createMessageObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let shouldMarkAsRead = false;
        
        entries.forEach((entry) => {
          const messageId = entry.target.getAttribute('data-message-id');
          const senderId = entry.target.getAttribute('data-sender-id');
          
          if (messageId && senderId && selectedConversation) {
            if (entry.isIntersecting) {
              // Сообщение стало видимым
              visibleMessagesRef.current.add(messageId);
              
              // Если это не мое сообщение, планируем отметить беседу как прочитанную
              if (senderId !== user?.id) {
                shouldMarkAsRead = true;
              }
            } else {
              // Сообщение стало невидимым
              visibleMessagesRef.current.delete(messageId);
            }
          }
        });
        
        // Отмечаем всю беседу как прочитанную если есть видимые непрочитанные сообщения через WebSocket
        if (shouldMarkAsRead && selectedConversation) {
          // Используем WebSocket для отметки беседы как прочитанной
          const success = markConversationAsRead(selectedConversation);
          if (!success) {
            console.warn('Failed to mark conversation as read via WebSocket');
          }
        }
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '0px',
        threshold: 0.5 // Сообщение считается видимым, если видно 50% его высоты
      }
    );
  }, [selectedConversation, user?.id, markAsRead, markConversationAsRead]);

  // Функция для отметки видимых сообщений как прочитанных
  // Отслеживаем уже отправленные запросы отметки прочтения
  const [markAsReadSent, setMarkAsReadSent] = useState<Set<string>>(new Set());
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markVisibleMessagesAsRead = useCallback(async (messagesData?: any) => {
    if (!selectedConversation || !user?.id || !messagesData) return;
    
    const messagesList = messagesData?.messages || messagesData?.data || [];
    const unreadMessages = messagesList.filter((msg: any) => {
      let actualSenderId = msg.senderId;
      if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
        const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
        if (idMatch) {
          actualSenderId = idMatch[1];
        }
      }
      
      const isNotMyMessage = actualSenderId !== user?.id;
      const isUnread = !msg.isRead && (!msg.readBy || !msg.readBy.includes(user?.id));
      
      return isNotMyMessage && isUnread;
    });

    if (unreadMessages.length > 0 && !markAsReadSent.has(selectedConversation)) {
      // Debounce: очищаем предыдущий таймер и создаем новый
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
      
      markAsReadTimeoutRef.current = setTimeout(() => {
        // Отмечаем всю беседу как прочитанную через WebSocket
        const success = markConversationAsRead(selectedConversation);
        if (success) {
          setMarkAsReadSent(prev => new Set(prev).add(selectedConversation));
        } else {
          console.warn('Failed to mark conversation as read via WebSocket');
        }
      }, 500); // 500ms debounce для более стабильной работы
    }
  }, [selectedConversation, user?.id, markConversationAsRead, markAsReadSent]);

  const handleTransferChat = useCallback(() => {
    if (!selectedSender) return;
    setShowTransferModal(true);
  }, [selectedSender]);

  const handleBlockUser = useCallback(() => {
    if (!selectedSender) return;
    setShowBlockModal(true);
  }, [selectedSender]);

  const handleTransferComplete = useCallback(() => {
    // Обновляем список разговоров после успешной передачи
    setSelectedConversation(null);
    setSelectedSender(null);
  }, []);

  const handleBlockComplete = useCallback(() => {
    // Обновляем список разговоров после успешной блокировки
    setSelectedConversation(null);
    setSelectedSender(null);
  }, []);

  // Присоединяемся к беседе при выборе - исправленная версия
  useEffect(() => {
    if (
      selectedConversation &&
      selectedConversation.match(/^[0-9a-fA-F]{24}$/)
    ) {
      if (isConnected) {
        joinConversation(selectedConversation);
      } else {
        console.log(`Will join conversation ${selectedConversation} when socket connects`);
      }

      return () => {
        if (isConnected) {
          leaveConversation(selectedConversation);
        }
      };
    }
  }, [selectedConversation, isConnected, joinConversation, leaveConversation]);

  // Автоматически присоединяемся к выбранной беседе когда сокет подключается
  useEffect(() => {
    if (isConnected && selectedConversation && selectedConversation.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Socket connected, joining conversation ${selectedConversation}`);
      joinConversation(selectedConversation);
    }
  }, [isConnected, selectedConversation, joinConversation]);

  // Инициализация observer при смене диалога
  useEffect(() => {
    if (selectedConversation && messagesContainerRef.current) {
      createMessageObserver();
      
      // Очищаем список видимых сообщений
      visibleMessagesRef.current.clear();
      
      // Отмечаем видимые сообщения как прочитанные через небольшую задержку
      const timer = setTimeout(() => {
        const messagesData = queryClient.getQueryData(['messages', selectedConversation]);
        markVisibleMessagesAsRead(messagesData);
      }, 500);
      
      return () => {
        clearTimeout(timer);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [selectedConversation, createMessageObserver, markVisibleMessagesAsRead, queryClient]);

  // Автоскролл к последнему сообщению и отмечаем как прочитанное
  const messagesLength = (messages?.messages || messages?.data || []).length;
  useEffect(() => {
    if (messagesLength > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        
        // Отмечаем непрочитанные сообщения как прочитанные
        let messageList = [];
        if (messages?.data && Array.isArray(messages.data)) {
          messageList = messages.data;
        } else if (messages?.messages && Array.isArray(messages.messages)) {
          messageList = messages.messages;
        } else if (Array.isArray(messages)) {
          messageList = messages;
        }
        
        const unreadMessages = messageList.filter(msg => {
          // Обрабатываем senderId для корректной проверки
          let actualSenderId = msg.senderId;
          if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
            const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
            if (idMatch) {
              actualSenderId = idMatch[1];
            }
          }
          
          // Проверяем, что это не мое сообщение и оно не прочитано
          const isNotMyMessage = actualSenderId !== user?.id;
          const isUnread = !msg.isRead && (!msg.readBy || !msg.readBy.includes(user?.id));
          
          return isNotMyMessage && isUnread;
        });
        
        if (unreadMessages.length > 0 && selectedConversation) {
          // Отмечаем всю беседу как прочитанную через WebSocket
          // НЕ обновляем UI сразу - ждем подтверждения от сервера
          const success = markConversationAsRead(selectedConversation);
          if (!success) {
            console.warn('Failed to mark conversation as read via WebSocket');
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesLength, messages, user?.id, selectedConversation, markConversationAsRead]);

  // Очищаем кэш отправленных запросов при смене беседы
  useEffect(() => {
    setMarkAsReadSent(new Set());
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
      markAsReadTimeoutRef.current = null;
    }
  }, [selectedConversation]);

  // Сброс счетчика диалогов при изменении поискового запроса
  useEffect(() => {
    setDisplayedDialogsCount(10);
  }, [searchQuery]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (updateConversationsTimeoutRef.current) {
        clearTimeout(updateConversationsTimeoutRef.current);
        updateConversationsTimeoutRef.current = null;
      }
    };
  }, []);

  // Функция для подсчета непрочитанных сообщений в конкретной беседе
  const calculateUnreadCount = useCallback((conversationId: string) => {
    const cachedMessages = queryClient.getQueryData(['messages', conversationId]);
    
    // Если есть кэшированные сообщения, используем их
    if (cachedMessages) {
      let messageList = [];
      if ((cachedMessages as any)?.data && Array.isArray((cachedMessages as any).data)) {
        messageList = (cachedMessages as any).data;
      } else if ((cachedMessages as any)?.messages && Array.isArray((cachedMessages as any).messages)) {
        messageList = (cachedMessages as any).messages;
      } else if (Array.isArray(cachedMessages)) {
        messageList = cachedMessages;
      }
      
      return messageList.filter((msg: any) => {
        let actualSenderId = msg.senderId;
        if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
          const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
          if (idMatch) {
            actualSenderId = idMatch[1];
          }
        }
        
        const isNotMyMessage = actualSenderId !== user?.id;
        const isUnread = !msg.isRead && (!msg.readBy || !msg.readBy.includes(user?.id));
        
        return isNotMyMessage && isUnread;
      }).length;
    }
    
    // Fallback: ищем беседу в списке conversations и используем unreadByParticipant
    if (conversations && Array.isArray(conversations)) {
      const conversation = conversations.find(conv => 
        (conv._id === conversationId || (conv as any).id === conversationId)
      );
      if (conversation && conversation.unreadByParticipant && user?.id) {
        return conversation.unreadByParticipant[user.id] || 0;
      }
    }
    
    return 0;
  }, [queryClient, user?.id, conversations]);

  // Мемоизируем фильтрацию отправителей для оптимизации
  const filteredSenders = useMemo(() => {
    console.log('filteredSenders: Processing conversations:', conversations?.length || 0);
    if (!conversations || conversations.length === 0) {
      console.log('filteredSenders: No conversations available');
      return [];
    }

    // Преобразуем беседы в отправителей с дедупликацией
    const sendersMap = new Map<string, SenderType>();
    
    conversations.forEach((conversation) => {
      const conversationId = conversation._id || (conversation as any).id;
      const participants = conversation.participants || [];
      
      // Для анонимных диалогов используем anonymousUser, для обычных - других участников
      let displayParticipants = [];
      
      if (conversation.type === 'anonymous-support' && (conversation as any).anonymousUser) {
        // Для анонимных диалогов показываем анонимного пользователя
        displayParticipants = [(conversation as any).anonymousUser];
      } else {
        // Для обычных диалогов находим участников, которые не являются текущим пользователем
        displayParticipants = participants.filter(
          (participant: any) => participant.id !== user?.id
        );
      }

      displayParticipants.forEach((participant: any) => {
        const participantKey = participant.id;
        const lastMessage = conversation.lastMessage;
        const lastMessageTime = lastMessage?.timestamp || conversation.createdAt;
        
        // Получаем реальное количество непрочитанных сообщений
        const actualUnreadCount = calculateUnreadCount(conversationId);
        const originalUnreadCount = conversation.unreadMessagesCount || 0;
        const finalUnreadCount = Math.max(actualUnreadCount, originalUnreadCount);
        
        // Проверяем, есть ли уже этот участник
        const existingSender = sendersMap.get(participantKey);
        
        if (!existingSender || new Date(lastMessageTime) > new Date(existingSender.lastMessageTime)) {
          // Берем самую свежую беседу для этого участника
          sendersMap.set(participantKey, {
            id: participant.id,
            name: participant.profile?.fullName || participant.profile?.username || participant.email || 'Анонимный',
            type: participant.role === 'operator' || participant.role === 'admin' ? 'operator' : 'visitor',
            avatar: participant.profile?.avatarUrl,
            unreadCount: finalUnreadCount,
            lastMessageTime: lastMessageTime,
            isOnline: participant.profile?.isOnline || false,
            conversationId: conversationId,
            email: participant.email || '',
            phone: participant.profile?.phone || '',
            role: participant.role || 'visitor',
            isAuthorized: participant.isActivated || false,
            source: participant.profile?.source || 'website'
          });
        }
      });
    });

    const senders = Array.from(sendersMap.values());
    console.log('filteredSenders: Created senders:', senders.length);

    // Фильтруем по поиску
    const filtered = senders.filter((sender) =>
      sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sender.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    console.log('filteredSenders: After search filter:', filtered.length, 'searchQuery:', searchQuery);

    // Сортируем: сначала непрочитанные, затем по времени последнего сообщения
    return filtered.sort((a, b) => {
      // Получаем актуальные данные о непрочитанных сообщениях
      const aUnreadCount = a.conversationId 
        ? Math.max(calculateUnreadCount(a.conversationId), a.unreadCount || 0)
        : (a.unreadCount || 0);
      const bUnreadCount = b.conversationId 
        ? Math.max(calculateUnreadCount(b.conversationId), b.unreadCount || 0)
        : (b.unreadCount || 0);
      
      // Сначала сортируем по наличию непрочитанных сообщений
      if (aUnreadCount > 0 && bUnreadCount === 0) return -1;
      if (aUnreadCount === 0 && bUnreadCount > 0) return 1;
      
      // Если у обоих есть непрочитанные сообщения, сортируем по количеству (больше непрочитанных = выше)
      if (aUnreadCount > 0 && bUnreadCount > 0) {
        const unreadDiff = bUnreadCount - aUnreadCount;
        if (unreadDiff !== 0) return unreadDiff;
      }
      
      // Если количество непрочитанных одинаково (или у обоих 0), сортируем по времени последнего сообщения
      const aTime = new Date(a.lastMessageTime).getTime();
      const bTime = new Date(b.lastMessageTime).getTime();
      return bTime - aTime;
    });
  }, [conversations, searchQuery, user?.id, calculateUnreadCount]);

  // Мемоизируем отображаемых отправителей с учетом пагинации
  const displayedSenders = useMemo(() => {
    return filteredSenders.slice(0, displayedDialogsCount);
  }, [filteredSenders, displayedDialogsCount]);

  // Мемоизируем текущих печатающих пользователей
  const currentTypingUsers = useMemo(() => {
    return selectedConversation ? typingUsers[selectedConversation] || [] : [];
  }, [selectedConversation, typingUsers]);

  // Функция для определения роли пользователя
  const getUserRole = useCallback((userId: string) => {
    // Сначала проверяем текущего пользователя
    if (userId === user?.id) {
      return user?.role || 'operator';
    }
    
    // Ищем среди участников текущей беседы
    if (selectedConversation && conversations) {
      const conversation = conversations.find(
        (conv) => conv._id === selectedConversation || (conv as any).id === selectedConversation
      );
      
      if (conversation && conversation.participants) {
        const participant = conversation.participants.find((p: any) => p.id === userId);
        if (participant && participant.role) {
          return participant.role;
        }
      }
    }
    
    // Ищем среди всех участников всех бесед
    if (conversations) {
      for (const conv of conversations) {
        if (conv.participants) {
          const participant = conv.participants.find((p: any) => p.id === userId);
          if (participant && participant.role) {
            return participant.role;
          }
        }
      }
    }
    
    // По умолчанию - посетитель
    return 'visitor';
  }, [user?.id, user?.role, selectedConversation, conversations]);

  // Подсчитываем общее количество непрочитанных сообщений
  const totalUnreadMessages = useMemo(() => {
    const total = filteredSenders.reduce((total, sender) => {
      if (sender.conversationId) {
        const actualCount = calculateUnreadCount(sender.conversationId);
        const finalCount = Math.max(actualCount, sender.unreadCount || 0);
        return total + finalCount;
      }
      return total + (sender.unreadCount || 0);
    }, 0);
    return total;
  }, [filteredSenders, calculateUnreadCount]);

  // Обновляем глобальный счетчик при изменении локального
  useEffect(() => {
    updateUnreadCount(totalUnreadMessages);
  }, [totalUnreadMessages, updateUnreadCount]);

  // Обработка выбора отправителя
  const handleSenderSelect = useCallback((sender: SenderType) => {
    setSelectedSender(sender);
    
    // Очищаем счетчик непрочитанных сообщений сразу
    if (sender.conversationId) {
      const actualUnreadCount = calculateUnreadCount(sender.conversationId);
      
      if (actualUnreadCount > 0) {
        // Отмечаем беседу как прочитанную через WebSocket
        const success = markConversationAsRead(sender.conversationId);
        if (!success) {
          console.warn('Failed to mark conversation as read via WebSocket');
        }
      }
    }
    
    // Проверяем, что conversationId существует и является валидным MongoDB ID
    if (
      sender.conversationId &&
      sender.conversationId.length === 24 &&
      /^[0-9a-fA-F]{24}$/.test(sender.conversationId)
    ) {
      setSelectedConversation(sender.conversationId);
    } else {
      console.warn(
        "Invalid conversationId:",
        sender.conversationId,
        "Length:",
        sender.conversationId?.length
      );
      setSelectedConversation(null);
    }
  }, [calculateUnreadCount, markConversationAsRead]);

  // Показываем уведомление о pending transfer request
  useEffect(() => {
    if (
      transferRequests &&
      transferRequests.length > 0 &&
      !showTransferRequestModal
    ) {
      const latestRequest = transferRequests[0];
      const currentRequestId = transferRequest?.id;
      if (latestRequest.id !== currentRequestId) {
        setTransferRequest(latestRequest);
        setShowTransferRequestModal(true);
      }
    }
  }, [transferRequests, showTransferRequestModal, transferRequest?.id]);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - список отправителей */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
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
                    onClick={() => {
                      if (transferRequests.length > 0) {
                        setTransferRequest(transferRequests[0]);
                        setShowTransferRequestModal(true);
                      }
                    }}
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

              {/* WebSocket статус */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : isConnecting ? (
                  <Radix.Spinner size="1" />
                ) : (
                  <div
                    className="cursor-pointer"
                    title="Не подключено. Нажмите для переподключения"
                    onClick={reconnect}
                  >
                    <WifiOff className="w-4 h-4 text-red-500" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reconnect}
                  className="h-6 px-2 text-xs"
                >
                  Reconnect
                </Button>
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
                  // Здесь можно добавить логику для открытия чата с пользователем
                }}
                className="text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
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
                // Получаем реальное количество непрочитанных сообщений
                const actualUnreadCount = sender.conversationId 
                  ? Math.max(calculateUnreadCount(sender.conversationId), sender.unreadCount || 0)
                  : (sender.unreadCount || 0);
                const hasUnread = actualUnreadCount > 0;
                
                return (
                  <div
                    key={`${sender.id}-${sender.conversationId}-${index}`}
                    onClick={() => handleSenderSelect(sender)}
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
                      status={
                        sender.isOnline
                          ? PresenceStatus.ONLINE
                          : PresenceStatus.OFFLINE
                      }
                      size="sm"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          hasUnread 
                            ? "font-bold text-foreground" 
                            : "font-medium text-foreground"
                        }`}>
                          {sender.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${
                            hasUnread 
                              ? "text-blue-600 dark:text-blue-400 font-medium" 
                              : "text-muted-foreground"
                          }`}>
                            {new Date(
                              sender.lastMessageTime
                            ).toLocaleTimeString()}
                          </span>
                          {actualUnreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                            >
                              {actualUnreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={
                            sender.type === "operator" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {sender.type === "operator"
                            ? "Оператор"
                            : "Посетитель"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  </div>
                );
              })}
              
              {/* Индикатор загрузки дополнительных диалогов */}
              {isLoadingMore && (
                <div className="p-4 flex justify-center">
                  <Radix.Spinner size="1" />
                  <span className="ml-2 text-sm text-muted-foreground">Загрузка...</span>
                </div>
              )}
              
              {/* Показываем если есть еще диалоги для загрузки */}
              {!isLoadingMore && displayedDialogsCount < filteredSenders.length && (
                <div className="p-4 flex justify-center">
                  <button
                    onClick={loadMoreDialogs}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Загрузить еще ({filteredSenders.length - displayedDialogsCount} диалогов)
                  </button>
                </div>
              )}
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
                          userName={selectedSender.name || "Неизвестный"}
                          avatar={selectedSender.avatar}
                          status={
                            selectedSender.isOnline
                              ? PresenceStatus.ONLINE
                              : PresenceStatus.OFFLINE
                          }
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {selectedSender.name || "Неизвестный"}
                            </h3>
                            <PresenceIndicator
                              status={
                                selectedSender.isOnline
                                  ? PresenceStatus.ONLINE
                                  : PresenceStatus.OFFLINE
                              }
                              size="sm"
                              showText={true}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
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
                    {currentTypingUsers.length === 1
                      ? "Пользователь печатает..."
                      : `${currentTypingUsers.length} пользователей печатают...`}
                  </div>
                )}
              </div>

              {/* Messages area */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center">
                    <Radix.Spinner />
                  </div>
                ) : (messages?.messages || messages?.data || []).length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Начните общение, отправив первое сообщение
                  </div>
                ) : (
                  (messages?.messages || messages?.data || [])?.map((message) => {
                    // Обрабатываем senderId - может быть строкой с объектом
                    let actualSenderId = message.senderId;
                    let senderInfo = null;
                    
                    // Проверяем, если senderId - это строка с объектом
                    if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
                      try {
                        // Извлекаем информацию из строки
                        const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
                        const emailMatch = actualSenderId.match(/email: '([^']+)'/);
                        const usernameMatch = actualSenderId.match(/username: '([^']+)'/);
                        
                        if (idMatch) {
                          actualSenderId = idMatch[1];
                          senderInfo = {
                            email: emailMatch ? emailMatch[1] : null,
                            username: usernameMatch ? usernameMatch[1] : null
                          };
                        }
                      } catch (error) {
                        console.warn('Error parsing senderId:', error);
                      }
                    }
                    
                    const isMyMessage = actualSenderId === user?.id;
                    
                    // Определяем роль отправителя - упрощенная логика
                    let senderRole = 'visitor';
                    let senderName = 'Неизвестный';
                    
                    // Проверяем, это мое сообщение или нет
                    if (isMyMessage) {
                      // Это сообщение текущего пользователя (оператора)
                      senderRole = user?.role || 'operator';
                      senderName = user?.profile?.fullName || user?.profile?.username || 'Я';
                    } else {
                      // Проверяем системное сообщение (приветственные сообщения от операторов)
                      if ((message as any).isSystemMessage && (message as any).senderName) {
                        senderRole = 'operator';
                        senderName = (message as any).senderName;
                      }
                      // Сначала проверяем роль в самом сообщении (если есть)
                      else if ((message as any).senderRole) {
                        senderRole = (message as any).senderRole;
                        senderName = (message as any).senderName || senderName;
                      } else {
                        // Используем функцию для определения роли
                        senderRole = getUserRole(actualSenderId);
                        
                        // Дополнительная проверка по email для определения роли оператора
                        if (senderInfo && senderInfo.email && senderInfo.email.includes('operator')) {
                          senderRole = 'operator';
                        }
                        
                        // Определяем имя отправителя
                        if (senderInfo && senderInfo.username) {
                          senderName = senderInfo.username;
                        } else {
                          // Проверяем среди участников беседы
                          const conversation = conversations?.find(
                            (conv) =>
                              conv._id === selectedConversation ||
                              (conv as any).id === selectedConversation
                          );
                          
                          if (conversation && conversation.participants) {
                            const sender = conversation.participants.find(
                              (p: any) => p.id === actualSenderId
                            );
                            if (sender) {
                              senderRole = sender.role || 'visitor';
                              senderName = sender.profile?.fullName || sender.profile?.username || 'Неизвестный';
                            }
                          }
                        }
                      }
                    }
                    
                    const isOperatorMessage = isMyMessage || senderRole === 'operator' || senderRole === 'admin';
                    
                    
                    return (
                      <div
                        key={message._id}
                        data-message-id={message._id || message.id}
                        data-sender-id={actualSenderId}
                        className={`flex ${
                          isOperatorMessage
                            ? "justify-end"
                            : "justify-start"
                        }`}
                        ref={(el) => {
                          if (el && observerRef.current) {
                            observerRef.current.observe(el);
                          }
                        }}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOperatorMessage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 border border-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{message.content || message.text}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p
                              className={`text-xs ${
                                isOperatorMessage
                                  ? "text-blue-200"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(message.timestamp || message.createdAt).toLocaleTimeString()}
                            </p>

                            {/* Статус прочтения для всех сообщений */}
                            <div className="flex items-center space-x-1">
                              {(() => {
                                // Определяем статус прочтения
                                const readByCount = message.readBy ? message.readBy.length : 0;
                                const isReadByRecipient = message.readBy && message.readBy.some((id: string) => id !== actualSenderId);
                                const isFullyRead = message.isRead || isReadByRecipient;
                                
                                if (isOperatorMessage) {
                                  // Сообщения от оператора
                                  if (isFullyRead) {
                                    return (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-blue-200">✓✓</span>
                                        <span className="text-xs text-blue-200">прочитано</span>
                                      </div>
                                    );
                                  } else if (readByCount > 0) {
                                    return <span className="text-blue-300">✓</span>;
                                  } else {
                                    return <span className="text-blue-400">✓</span>;
                                  }
                                } else {
                                  // Сообщения от пользователя
                                  if (isFullyRead) {
                                    return (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-green-600">✓✓</span>
                                        <span className="text-xs text-green-600">прочитано</span>
                                      </div>
                                    );
                                  } else if (readByCount > 0) {
                                    return <span className="text-green-500">✓</span>;
                                  } else {
                                    return <span className="text-gray-400">✓</span>;
                                  }
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Скролл к последнему сообщению */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 bg-card border-t border-border">
                {/* Debug connection status */}
                <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
                  <span>Socket: {isConnected ? 'Connected' : 'Disconnected'}</span>
                  {isConnecting && <span>(Connecting...)</span>}
                  {wsError && <span className="text-red-500">(Error: {wsError})</span>}
                  {!isConnected && (
                    <button 
                      onClick={reconnect}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      Reconnect
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-accent rounded-lg">
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </button>

                  <input
                    type="text"
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
              </div>
            </div>
          )}
        </div>

        {/* User info sidebar */}
        {selectedSender && (
          <div className="w-80 bg-card border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                Информация о пользователе
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Avatar and basic info */}
              <div className="text-center">
                <div className="mb-3">
                  <PresenceAvatar
                    userId={selectedSender.id}
                    userName={selectedSender.name || "Неизвестный"}
                    avatar={selectedSender.avatar}
                    status={
                      selectedSender.isOnline
                        ? PresenceStatus.ONLINE
                        : PresenceStatus.OFFLINE
                    }
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <h4 className="font-semibold text-foreground">
                  {selectedSender.name || "Неизвестный"}
                </h4>
                <div className="flex justify-center mt-2">
                  <PresenceIndicator
                    status={
                      selectedSender.isOnline
                        ? PresenceStatus.ONLINE
                        : PresenceStatus.OFFLINE
                    }
                    size="sm"
                    showText={true}
                  />
                </div>
                <Badge
                  variant={
                    selectedSender.type === "operator" ? "default" : "secondary"
                  }
                  className="mt-2"
                >
                  {selectedSender.type === "operator"
                    ? "Оператор"
                    : "Посетитель"}
                </Badge>
              </div>

              {/* User details */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <h5 className="font-medium text-foreground mb-3">
                    Контактная информация
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">ID</p>
                        <p className="text-sm text-foreground font-mono">
                          {selectedSender.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm text-foreground">
                          {selectedSender.email || "Не указан"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Телефон</p>
                        <p className="text-sm text-foreground">
                          {selectedSender.phone || "Не указан"}
                        </p>
                      </div>
                    </div>

                    {selectedSender.type === "visitor" && (
                      <>
                        <div className="flex items-center space-x-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Статус
                            </p>
                            <p className="text-sm text-foreground">
                              {selectedSender.isAuthorized
                                ? "Авторизован"
                                : "Не авторизован"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Источник
                            </p>
                            <p className="text-sm text-foreground">
                              {selectedSender.source || "Не указан"}
                            </p>
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
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedSender.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-sm text-foreground">
                      {selectedSender.isOnline ? "В сети" : "Не в сети"}
                    </span>
                  </div>
                </div>

                {/* Action buttons for visitors */}
                {selectedSender.type === "visitor" && (
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

      {/* Modal windows */}
      {selectedSender && (
        <>
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            visitorId={selectedSender.id}
            visitorName={selectedSender.name}
            conversationId={selectedConversation || ""}
            onTransferComplete={handleTransferComplete}
          />

          <BlockUserModal
            isOpen={showBlockModal}
            onClose={() => setShowBlockModal(false)}
            userId={selectedSender.id}
            userName={selectedSender.name}
            userEmail={selectedSender.email}
            userAvatar={selectedSender.avatar}
            conversationId={selectedConversation || ""}
            onBlockComplete={handleBlockComplete}
          />
        </>
      )}

      {transferRequest && (
        <TransferRequestModal
          isOpen={showTransferRequestModal}
          onClose={() => {
            setShowTransferRequestModal(false);
            setTransferRequest(null);
          }}
          transferRequest={transferRequest}
          onRequestProcessed={() => {
            setShowTransferRequestModal(false);
            setTransferRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default function OperatorChatPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.OPERATOR}>
      <OperatorChatPageContent />
    </ProtectedRoute>
  );
}
