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
    reconnect,
  } = useChat();

  // Логирование для отслеживания перерендеров
  console.log(
    `[${new Date().toISOString()}] OperatorChatPageContent: Component rendered, user: ${
      user?.id || "none"
    }, token: ${!!token}`
  );
  console.log(
    `[${new Date().toISOString()}] OperatorChatPageContent: Selected conversation: ${selectedConversation}, isConnected: ${isConnected}`
  );

  // Инвалидируем запросы при получении новых сообщений - убираем для стабилизации
  // useEffect(() => {
  //   if (isConnected) {
  //     const interval = setInterval(() => {
  //       // Обновляем список разговоров каждые 30 секунд для получения анонимных сообщений
  //       queryClient.invalidateQueries({ queryKey: ['conversations'] });
  //     }, 30000);

  //     return () => clearInterval(interval);
  //   }
  // }, [isConnected, queryClient]);

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
      console.log("Conversations response:", response.data);
      // Логируем каждую беседу с ее unreadMessagesCount
      response.data?.forEach((conv: any) => {
        console.log(`Conversation ${conv._id || conv.id}: unreadMessagesCount=${conv.unreadMessagesCount}`);
      });
      return response.data;
    },
    enabled: !!user && !!token,
    refetchInterval: 60000, // Обновляем каждую минуту вместо 10 секунд
    refetchOnWindowFocus: false, // Убираем автообновление при фокусе
    staleTime: 30000, // Данные считаются свежими 30 секунд
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
      console.log("Messages API response:", response.data);
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
          // Отмечаем сообщения как прочитанные через WebSocket
          unreadMessages.forEach(msg => {
            markAsRead(selectedConversation, msg._id || msg.id);
          });
          
          // Отмечаем всю беседу как прочитанную через API
          chatAPI.markAsRead(selectedConversation).catch(error => {
            console.error('Error marking conversation as read:', error);
          });
          
          // Обновляем локальный кэш сообщений
          queryClient.setQueryData(
            ['messages', selectedConversation],
            (oldData: any) => {
              if (!oldData) return oldData;
              
              let messages = [];
              if (oldData.data && Array.isArray(oldData.data)) {
                messages = oldData.data;
              } else if (oldData.messages && Array.isArray(oldData.messages)) {
                messages = oldData.messages;
              } else if (Array.isArray(oldData)) {
                messages = oldData;
              }
              
              const updatedMessages = messages.map((msg: any) => {
                // Проверяем, является ли сообщение непрочитанным
                let actualSenderId = msg.senderId;
                if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
                  const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
                  if (idMatch) {
                    actualSenderId = idMatch[1];
                  }
                }
                
                if (actualSenderId !== user?.id) {
                  return {
                    ...msg,
                    isRead: true,
                    readBy: [...new Set([...(msg.readBy || []), user?.id])],
                    readTimestamps: {
                      ...msg.readTimestamps,
                      [user?.id || '']: new Date().toISOString()
                    }
                  };
                }
                return msg;
              });
              
              // Возвращаем в том же формате
              if (oldData.data) {
                return { ...oldData, data: updatedMessages };
              } else if (oldData.messages) {
                return { ...oldData, messages: updatedMessages };
              } else {
                return updatedMessages;
              }
            }
          );
          
          // Обновляем счетчик непрочитанных сообщений в конверсациях
          queryClient.setQueryData(
            ['conversations'],
            (oldData: any) => {
              if (!Array.isArray(oldData)) return oldData;
              return oldData.map((conv: any) => 
                conv._id === selectedConversation || conv.id === selectedConversation ? {
                  ...conv,
                  unreadMessagesCount: 0
                } : conv
              );
            }
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesLength, messages, user?.id, selectedConversation, markAsRead, queryClient, chatAPI]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Функция для подсчета непрочитанных сообщений в конкретной беседе
  const calculateUnreadCount = useCallback((conversationId: string) => {
    const cachedMessages = queryClient.getQueryData(['messages', conversationId]);
    if (!cachedMessages) return 0;
    
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
  }, [queryClient, user?.id]);

  // Мемоизируем фильтрацию отправителей для оптимизации
  const filteredSenders = useMemo(() => {
    if (!conversations || conversations.length === 0) return [];

    // Преобразуем беседы в отправителей
    const senders = conversations.reduce((acc: SenderType[], conversation) => {
      const conversationId = conversation._id || (conversation as any).id;
      const participants = conversation.participants || [];
      
      // Находим участников, которые не являются текущим пользователем
      const otherParticipants = participants.filter(
        (participant: any) => participant.id !== user?.id
      );

      otherParticipants.forEach((participant: any) => {
        const lastMessage = conversation.lastMessage;
        const lastMessageTime = lastMessage?.timestamp || conversation.createdAt;
        
        // Получаем реальное количество непрочитанных сообщений
        const actualUnreadCount = calculateUnreadCount(conversationId);
        const originalUnreadCount = conversation.unreadMessagesCount || 0;
        const finalUnreadCount = Math.max(actualUnreadCount, originalUnreadCount);
        
        console.log(`Sender ${participant.profile?.fullName || participant.profile?.username}: cached=${actualUnreadCount}, original=${originalUnreadCount}, final=${finalUnreadCount}`);
        
        acc.push({
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
      });

      return acc;
    }, []);

    // Фильтруем по поиску
    const filtered = senders.filter((sender) =>
      sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sender.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Сортируем: сначала непрочитанные, затем по времени
    return filtered.sort((a, b) => {
      // Сначала сортируем по наличию непрочитанных сообщений
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Если у обоих есть непрочитанные или у обоих нет, сортируем по времени
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }, [conversations, searchQuery, user?.id, calculateUnreadCount]);

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
        console.log(`Total calc for ${sender.name}: cached=${actualCount}, original=${sender.unreadCount}, final=${finalCount}`);
        return total + finalCount;
      }
      return total + (sender.unreadCount || 0);
    }, 0);
    console.log(`Total unread messages: ${total}`);
    return total;
  }, [filteredSenders, calculateUnreadCount]);

  // Обработка выбора отправителя
  const handleSenderSelect = useCallback((sender: SenderType) => {
    console.log("Selecting sender:", sender);
    setSelectedSender(sender);
    
    // Очищаем счетчик непрочитанных сообщений сразу
    if (sender.conversationId) {
      const actualUnreadCount = calculateUnreadCount(sender.conversationId);
      
      if (actualUnreadCount > 0) {
        // Отмечаем беседу как прочитанную через API
        chatAPI.markAsRead(sender.conversationId).catch(error => {
          console.error('Error marking conversation as read:', error);
        });
        
        // Обновляем локальные данные
        queryClient.setQueryData(
          ['conversations'],
          (oldData: any) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.map((conv: any) => 
              (conv._id === sender.conversationId || conv.id === sender.conversationId) ? {
                ...conv,
                unreadMessagesCount: 0
              } : conv
            );
          }
        );
      }
    }
    
    // Проверяем, что conversationId существует и является валидным MongoDB ID
    if (
      sender.conversationId &&
      sender.conversationId.length === 24 &&
      /^[0-9a-fA-F]{24}$/.test(sender.conversationId)
    ) {
      console.log("Setting conversation ID:", sender.conversationId);
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
  }, [queryClient, calculateUnreadCount, chatAPI]);

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
                  console.log("Clicked online user:", userId);
                  // Здесь можно добавить логику для открытия чата с пользователем
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
              {filteredSenders.map((sender) => {
                // Получаем реальное количество непрочитанных сообщений
                const actualUnreadCount = sender.conversationId 
                  ? Math.max(calculateUnreadCount(sender.conversationId), sender.unreadCount || 0)
                  : (sender.unreadCount || 0);
                const hasUnread = actualUnreadCount > 0;
                
                return (
                  <div
                    key={sender.id}
                    onClick={() => handleSenderSelect(sender)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedSender?.id === sender.id
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    
                    // Определяем роль отправителя
                    let senderRole = 'visitor';
                    let senderName = 'Неизвестный';
                    
                    // Сначала проверяем роль в самом сообщении (если есть)
                    if ((message as any).senderRole) {
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
                      if (isMyMessage) {
                        senderName = user?.profile?.fullName || user?.profile?.username || 'Я';
                      } else {
                        // Сначала проверяем информацию из самого сообщения
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
                              senderName = sender.profile?.fullName || sender.profile?.username || 'Неизвестный';
                            }
                          }
                        }
                      }
                    }
                    
                    const isOperatorMessage = senderRole === 'operator' || senderRole === 'admin';
                    
                    console.log(`Message: originalSenderId=${message.senderId}, actualSenderId=${actualSenderId}, userId=${user?.id}, isMyMessage=${isMyMessage}, senderRole=${senderRole}, isOperatorMessage=${isOperatorMessage}, senderInfo=`, senderInfo);
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isOperatorMessage
                            ? "justify-end"
                            : "justify-start"
                        }`}
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

                            {/* Статус прочтения */}
                            {isOperatorMessage && (
                              <div className="flex items-center space-x-1">
                                {message.isRead || (message.readBy && message.readBy.length > 1) ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-blue-200">✓✓</span>
                                    <span className="text-xs text-blue-200">прочитано</span>
                                  </div>
                                ) : message.readBy && message.readBy.length > 0 ? (
                                  <span className="text-blue-300">✓</span>
                                ) : (
                                  <span className="text-blue-400">✓</span>
                                )}
                              </div>
                            )}
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
