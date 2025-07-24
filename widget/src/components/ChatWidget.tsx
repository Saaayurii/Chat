import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Paperclip, Star, Flag, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useWidgetStore } from '../stores/widgetStore';
import { useSocketIO } from '../hooks/useSocketIO';
import { useApiCall } from '../hooks/useApiCall';
import { chatCore } from '../core';
import type { ChatWidgetConfig, Message, OperatorInfo } from '../types';
import Button from './UI/Button';
import Input from './UI/Input';
import Avatar from './UI/Avatar';
import Loading from './UI/Loading';
import RatingModal from './RatingModal';
import ComplaintModal from './ComplaintModal';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';

interface ChatWidgetProps extends ChatWidgetConfig {
  onClose?: () => void;
  onMinimize?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl = 'http://localhost:3004',
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
  autoLoad = true,
  minimizeOnStart = false,
}) => {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state
  const [inputMessage, setInputMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'reset'>('login');
  
  // Store state
  const { token, user, isAuthenticated, sessionId, initializeAuth } = useAuthStore();
  const {
    isOpen,
    isMinimized,
    isConnected,
    isCreatingConversation,
    showRatingModal,
    showComplaintModal,
    id: conversationId,
    messages,
    isTyping,
    operatorInfo,
    setIsMinimized,
    setIsConnected,
    setIsCreatingConversation,
    setShowRatingModal,
    setShowComplaintModal,
    setConversationId,
    addMessage,
    setMessages,
    updateMessage,
    removeMessage,
    setIsTyping,
    setOperatorInfo,
    updateOperatorInfo,
    toggleWidget,
    minimizeWidget,
    restoreConversationId,
    saveConversationId,
    clearConversationId
  } = useWidgetStore();

  // API hooks
  const { execute: executeApi } = useApiCall();

  // Initialize auth and restore conversation
  useEffect(() => {
    if (autoLoad) {
      initializeAuth();
      restoreConversationId();
    }
    
    if (minimizeOnStart) {
      setIsMinimized(true);
    }

    // Update core API URL
    if (apiUrl) {
      chatCore.updateApiUrl(apiUrl);
    }
  }, [autoLoad, minimizeOnStart, apiUrl, initializeAuth, restoreConversationId]);

  // WebSocket connection
  // Мемоизируем колбеки чтобы избежать постоянных переподключений
  const handleMessage = useCallback((message: any) => {
      console.log('🔥 Widget received WebSocket message:', message);
      
      if (message.type === 'new-message') {
        console.log('📨 Processing new_message event:', message.data);
        console.log('📨 Full message structure:', JSON.stringify(message, null, 2));
        // Получаем правильные данные сообщения
        const msgData = message.data.data || message.data;
        
        // Улучшенная проверка для определения сообщений от оператора
        let actualSenderId = msgData.senderId;
        
        // Обрабатываем случай, когда senderId приходит как объект с _id
        if (typeof actualSenderId === 'object' && actualSenderId) {
          actualSenderId = actualSenderId._id || actualSenderId.id;
        }
        // Обрабатываем случай, когда senderId приходит как строка с ObjectId
        if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
          const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
          if (idMatch) {
            actualSenderId = idMatch[1];
          }
        }
        
        // Для анонимных пользователей используем sessionId, а не сгенерированный userId
        const currentUserId = token === 'anonymous' 
          ? sessionId 
          : (user?._id || user?.id || sessionId);
          
        console.log(`📝 CurrentUserId logic: token=${token} sessionId=${sessionId} userId=${user?._id || user?.id} -> currentUserId=${currentUserId}`);
        
        // Логика как в операторском чате
        const isSystemOperatorMessage = msgData.isSystemMessage && msgData.senderName && 
          (msgData.senderName !== 'Неизвестный');
        
        const senderRole = msgData.senderRole || 'visitor';
        
        const isOperatorMessage = isSystemOperatorMessage || 
                                 senderRole === 'operator' || 
                                 senderRole === 'admin' ||
                                 (actualSenderId && actualSenderId !== currentUserId && actualSenderId !== null);
                                 
        const isUserMessage = !isOperatorMessage;
        const finalSender = isUserMessage ? 'user' : 'operator';
        
        console.log(`🔍 New message: [${(msgData.text || msgData.content || '').substring(0, 15)}...] senderId=${actualSenderId} currentUserId=${currentUserId} senderName=${msgData.senderName} -> ${finalSender.toUpperCase()}`);
        
        // Определяем корректное имя отправителя
        let displayName = msgData.senderName || operatorName;
        
        // Если это сообщение от оператора и senderName содержит email, заменяем на имя оператора
        if (isOperatorMessage && msgData.senderName && msgData.senderName.includes('@')) {
          displayName = operatorInfo?.name || operatorName;
        }
        
        const newMessage: Message = {
          id: msgData.id || msgData._id || Date.now().toString(),
          content: msgData.text || msgData.content,
          timestamp: new Date(msgData.timestamp || msgData.createdAt),
          sender: finalSender,
          senderName: displayName,
          type: msgData.isSystemMessage ? 'system' : (msgData.type || 'text'),
          isRead: msgData.isRead || false,
          readBy: msgData.readBy || []
        };
        
        console.log('✅ Adding message to widget:', newMessage);
        addMessage(newMessage);
        
        // Обновляем информацию об операторе, если сообщение от оператора
        if (isOperatorMessage && actualSenderId && msgData.senderName) {
          // Если senderName содержит email, получаем имя оператора из профиля
          const operatorDisplayName = msgData.senderName.includes('@') 
            ? operatorInfo?.name || 'Оператор поддержки'
            : msgData.senderName;
          
          setOperatorInfo({
            id: actualSenderId,
            name: operatorDisplayName,
            avatar: operatorInfo?.avatar,
            isOnline: true
          });
        }
      } else if (message.type === 'room-joined') {
        console.log('🏠 Successfully joined room:', message.data.conversationId);
      } else if (message.type === 'conversation-read') {
        console.log('📖 Message marked as read:', message.data);
        // Обновляем статус прочтения для сообщений пользователя
        const { readBy } = message.data;
        const updatedMessages = messages.map((msg: Message): Message => 
          msg.sender === 'user' ? {
            ...msg,
            isRead: true,
            readBy: [...(msg.readBy || []), readBy].filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index)
          } : msg
        );
        setMessages(updatedMessages);
      } else if (message.type === 'typing') {
        setIsTyping(message.data.isTyping);
      } else if (message.type === 'operator_status') {
        updateOperatorInfo((prev: OperatorInfo | null) => prev ? {
          ...prev,
          isOnline: message.data.isOnline
        } : null);
      } else if (message.type === 'cached-messages') {
        const cachedMessages = ((message as any).messages || []).map((msg: any) => {
          // Для анонимных пользователей используем sessionId
          const currentUserId = token === 'anonymous' 
            ? sessionId 
            : (user?._id || user?.id || sessionId);
          
          // Отладочные логи для cached messages
          console.log(`📦 Cached: [${(msg.text || '').substring(0, 15)}...] senderId=${msg.senderId} currentUserId=${currentUserId} senderName=${msg.senderName}`);
          
          // Логика как в операторском чате
          const isSystemOperatorMessage = msg.isSystemMessage && msg.senderName && 
            (msg.senderName !== 'Неизвестный');
          
          const senderRole = msg.senderRole || 'visitor';
          
          const isOperatorMsg = isSystemOperatorMessage || 
                               senderRole === 'operator' || 
                               senderRole === 'admin' ||
                               (msg.senderId && msg.senderId !== currentUserId && msg.senderId !== null);
                               
          const isUserMessage = !isOperatorMsg;
          
          console.log(`✅ Cached decision: [${(msg.text || '').substring(0, 15)}...] -> ${isUserMessage ? 'USER' : 'OPERATOR'} (isUser=${isUserMessage}, isOp=${isOperatorMsg})`);
          
          // Определяем корректное имя отправителя
          let displayName = msg.senderName || operatorName;
          if (isOperatorMsg && msg.senderName && msg.senderName.includes('@')) {
            displayName = operatorInfo?.name || operatorName;
          }
          
          return {
            id: msg.id,
            content: msg.text,
            timestamp: new Date(msg.timestamp),
            sender: isUserMessage ? 'user' : 'operator',
            senderName: displayName,
            type: msg.type || 'text',
            isRead: msg.isRead || false,
            readBy: msg.readBy || []
          };
        });
        
        setMessages([...cachedMessages, ...messages]);
        console.log('Loaded cached messages:', cachedMessages.length);
      }
  }, [operatorInfo?.id, operatorName, addMessage, setIsTyping, updateOperatorInfo, user?._id, user?.id, setMessages, messages]);

  const handleConnect = useCallback(() => {
    console.log('🚀 Widget WebSocket connected');
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
  }, []);

  const { emit: emitSocketEvent } = useSocketIO('/chat', {
    autoConnect: !!(conversationId && (isAuthenticated || sessionId)),
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError
  });

  // Get available operator
  const getAvailableOperator = useCallback(async (): Promise<OperatorInfo> => {
    try {
      console.log('Getting available operator...');
      
      // Try to get online operators first
      const onlineOperators = await chatCore.getOnlineOperators();
      if (onlineOperators.length > 0) {
        const operator = onlineOperators[0];
        // Создаем полное имя оператора
        const getOperatorDisplayName = (operator: any) => {
          if (operator?.profile?.fullName) return operator.profile.fullName;
          if (operator?.firstName && operator?.lastName) return `${operator.firstName} ${operator.lastName}`;
          if (operator?.profile?.username) return operator.profile.username;
          if (operator?.firstName) return operator.firstName;
          if (operator?.email && !operator.email.includes('@chatsystem.com')) return operator.email;
          return 'Оператор поддержки';
        };
        
        return {
          id: operator.id,
          name: getOperatorDisplayName(operator),
          avatar: operator.profile?.avatarUrl,
          isOnline: true
        } as OperatorInfo;
      }
      
      // Fallback to any operator
      const operators = await chatCore.getOperators();
      if (operators.length > 0) {
        const operator = operators[0];
        // Создаем полное имя оператора
        const getOperatorDisplayName = (operator: any) => {
          if (operator?.profile?.fullName) return operator.profile.fullName;
          if (operator?.firstName && operator?.lastName) return `${operator.firstName} ${operator.lastName}`;
          if (operator?.profile?.username) return operator.profile.username;
          if (operator?.firstName) return operator.firstName;
          if (operator?.email && !operator.email.includes('@chatsystem.com')) return operator.email;
          return 'Оператор поддержки';
        };
        
        return {
          id: operator.id,
          name: getOperatorDisplayName(operator),
          avatar: operator.profile?.avatarUrl,
          isOnline: false
        } as OperatorInfo;
      }
      
      // Default operator
      return {
        id: 'default_operator',
        name: 'Оператор поддержки',
        avatar: operatorAvatar,
        isOnline: false
      };
    } catch (error) {
      console.error('Error getting operator:', error);
      return {
        id: 'system_support',
        name: 'Система поддержки',
        avatar: operatorAvatar,
        isOnline: false
      };
    }
  }, [operatorAvatar]);

  // Create conversation
  const createConversation = useCallback(async () => {
    if (!token || isCreatingConversation) return;
    
    if (token !== 'anonymous' && !user) {
      console.log('Waiting for user data...');
      return;
    }
    
    setIsCreatingConversation(true);
    try {
      console.log('Getting available operator...');
      const operator = await getAvailableOperator();
      setOperatorInfo(operator);
      
      const isAnonymous = token === 'anonymous' || !user?.id;
      const currentSessionId = sessionId || user?.sessionId;
      if (!currentSessionId) {
        throw new Error('SessionId не найден - необходим для создания разговора');
      }
      const userName = user?.profile?.fullName || user?.profile?.username || user?.firstName || 'Посетитель';
      const userEmail = user?.email;
      
      console.log('Creating conversation:', { isAnonymous, userName, userEmail, sessionId: currentSessionId });
      
      const requestData = {
        visitorName: userName,
        visitorEmail: userEmail,
        title: 'Обращение с сайта',
        sessionId: currentSessionId,
        initialMessage: '',
        ...((!isAnonymous && (user?.id || user?._id)) && {
          userId: user?.id || user?._id,
          userRole: user?.role
        })
      };
      
      console.log('Sending conversation request:', requestData);
      
      const result = await executeApi(() => chatCore.createAnonymousConversation(requestData));
      
      const convId = result.id || result._id;
      if (convId) {
        setConversationId(convId);
        saveConversationId(convId);
        
        const assignedOperator = result.assignedOperator;
        
        // Создаем полное имя оператора из доступных данных
        const getOperatorDisplayName = (operator: any) => {
          if (operator?.profile?.fullName) return operator.profile.fullName;
          if (operator?.firstName && operator?.lastName) return `${operator.firstName} ${operator.lastName}`;
          if (operator?.profile?.username) return operator.profile.username;
          if (operator?.firstName) return operator.firstName;
          if (operator?.email && !operator.email.includes('@chatsystem.com')) return operator.email;
          return 'Оператор поддержки';
        };
        
        const finalOperatorName = assignedOperator 
          ? getOperatorDisplayName(assignedOperator)
          : operator.name;
        
        setOperatorInfo({
          id: assignedOperator?._id || assignedOperator?.id || operator.id,
          name: finalOperatorName,
          avatar: assignedOperator?.profile?.avatarUrl || operator.avatar,
          isOnline: assignedOperator ? true : operator.isOnline
        });
        
        // Не создаем приветственное сообщение - оно приходит с backend
        setMessages([]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  }, [
    token, user, sessionId, isCreatingConversation, welcomeMessage, 
    executeApi, getAvailableOperator, setIsCreatingConversation, 
    setOperatorInfo, setConversationId, saveConversationId, 
    setMessages, setIsConnected
  ]);

  // Restore conversation on mount
  useEffect(() => {
    const restoreConversation = async () => {
      console.log('Restore check:', { conversationId, token, messagesLength: messages.length });
      if (conversationId && token && !messages.length) {
        try {
          console.log('Restoring conversation:', conversationId);
          
          const conversationMessages = await chatCore.getConversationMessages(conversationId, 50);
          console.log('Got conversation messages:', conversationMessages);
          
          if (Array.isArray(conversationMessages) && conversationMessages.length > 0) {
            const formattedMessages = conversationMessages.map((msg: any) => {
              // Улучшенная проверка для определения сообщений от оператора при восстановлении
              let actualSenderId = msg.senderId;
              
              // Обрабатываем случай, когда senderId приходит как объект с _id
              if (typeof actualSenderId === 'object' && actualSenderId) {
                actualSenderId = actualSenderId._id || actualSenderId.id;
              }
              // Обрабатываем случай, когда senderId приходит как строка с ObjectId
              if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
                const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
                if (idMatch) {
                  actualSenderId = idMatch[1];
                }
              }
              
              // Для анонимных пользователей используем sessionId, а не сгенерированный userId
              const currentUserId = token === 'anonymous' 
                ? sessionId 
                : (user?._id || user?.id || sessionId);
              
              // Отладочные логи для понимания проблемы
              console.log(`🔍 Restore: [${(msg.text || msg.content || '').substring(0, 15)}...] senderId=${actualSenderId} currentUserId=${currentUserId} senderName=${msg.senderName}`);
              
              // Логика как в операторском чате: проверяем роль и тип сообщения
              // Проверяем системное сообщение от оператора
              const isSystemOperatorMessage = msg.isSystemMessage && msg.senderName && 
                (msg.senderName !== 'Неизвестный');
              
              // Проверяем роль в самом сообщении
              const senderRole = msg.senderRole || 'visitor';
              
              // Определяем сообщение от оператора
              const isOperatorMessage = isSystemOperatorMessage || 
                                       senderRole === 'operator' || 
                                       senderRole === 'admin' ||
                                       (actualSenderId && actualSenderId !== currentUserId && actualSenderId !== null);
                                       
              const isUserMessage = !isOperatorMessage;
              
              // Определяем корректное имя отправителя для восстанавливаемых сообщений
              let displayName = msg.senderName || 'Неизвестный';
              if (isOperatorMessage && msg.senderName && msg.senderName.includes('@')) {
                displayName = operatorInfo?.name || operatorName;
              }
              
              console.log(`✅ Restore decision: [${(msg.text || msg.content || '').substring(0, 15)}...] -> ${isUserMessage ? 'USER' : 'OPERATOR'} (isUser=${isUserMessage}, isOp=${isOperatorMessage})`);
              
              return {
                id: msg._id || msg.id,
                content: msg.text || msg.content,
                timestamp: new Date(msg.createdAt || msg.timestamp),
                sender: isUserMessage ? 'user' : 'operator',
                senderName: displayName,
                type: msg.isSystemMessage ? 'system' : 'text',
                isRead: msg.isRead || false,
                readBy: msg.readBy || []
              } as Message;
            });
            
            setMessages(formattedMessages);
            setIsConnected(true);
            console.log('Restored messages:', formattedMessages.length);
          }
          
          // Restore conversation info
          const conversationData = await chatCore.getConversation(conversationId);
          const assignedOperator = conversationData.assignedOperator;
          
          if (assignedOperator) {
            // Создаем полное имя оператора из доступных данных
            const getOperatorDisplayName = (operator: any) => {
              if (operator?.profile?.fullName) return operator.profile.fullName;
              if (operator?.firstName && operator?.lastName) return `${operator.firstName} ${operator.lastName}`;
              if (operator?.profile?.username) return operator.profile.username;
              if (operator?.firstName) return operator.firstName;
              if (operator?.email && !operator.email.includes('@chatsystem.com')) return operator.email;
              return 'Оператор поддержки';
            };
            
            const operatorName = getOperatorDisplayName(assignedOperator);
            setOperatorInfo({
              id: assignedOperator._id || assignedOperator.id,
              name: operatorName,
              avatar: assignedOperator.profile?.avatarUrl,
              isOnline: true
            });
          }
        } catch (error) {
          console.error('Error restoring conversation:', error);
          setConversationId(null);
          clearConversationId();
        }
      }
    };

    restoreConversation();
  }, [conversationId, token, messages.length, operatorInfo?.id]);

  // Create conversation when opening widget
  useEffect(() => {
    const canCreateConversation = token && !conversationId && !isCreatingConversation && 
                                 (token === 'anonymous' || user);
    
    if (isOpen && canCreateConversation) {
      createConversation();
    }
  }, [isOpen, token, user, conversationId, isCreatingConversation, createConversation]);

  // WebSocket room joining
  useEffect(() => {
    if (conversationId && token && isConnected) {
      console.log('🏠 Widget joining WebSocket room:', conversationId);
      // Небольшая задержка чтобы убедиться что соединение стабильно
      setTimeout(() => {
        emitSocketEvent('join-room', { conversationId });
        emitSocketEvent('get-cached-messages', { conversationId, limit: 50 });
      }, 100);
    }
  }, [conversationId, token, isConnected, emitSocketEvent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when widget is open (with deduplication)
  const hasUnreadMessages = useRef(false);
  const lastReadTimestamp = useRef<number>(0);
  
  useEffect(() => {
    if (isOpen && conversationId && messages.length > 0) {
      // Check if there are actually any unread messages from operator
      const unreadOperatorMessages = messages.filter(msg => 
        msg.sender === 'operator' && !msg.isRead
      );
      
      // Only mark as read if there are unread operator messages and we haven't read recently
      const now = Date.now();
      const shouldMarkAsRead = unreadOperatorMessages.length > 0 && 
                              (now - lastReadTimestamp.current) > 5000; // 5 second cooldown
      
      if (shouldMarkAsRead) {
        hasUnreadMessages.current = true;
        const markAsRead = async () => {
          try {
            lastReadTimestamp.current = now;
            await chatCore.markMessagesAsRead(conversationId, sessionId || undefined);
            console.log(`Messages marked as read (${unreadOperatorMessages.length} unread messages)`);
            hasUnreadMessages.current = false;
          } catch (error) {
            console.warn('Failed to mark messages as read:', error);
            lastReadTimestamp.current = 0; // Reset on error to allow retry
          }
        };

        const timer = setTimeout(markAsRead, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, conversationId, messages, sessionId]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || !token) return;
    
    const messageText = inputMessage;
    const tempId = `temp_${Date.now()}`;
    
    // Add message locally for better UX
    const newMessage: Message = {
      id: tempId,
      content: messageText,
      timestamp: new Date(),
      sender: 'user',
      type: 'text',
      isRead: false,
      readBy: []
    };
    
    addMessage(newMessage);
    setInputMessage('');
    
    const isAnonymousUser = token === 'anonymous' || user?.isAnonymous || !user?.id;
    
    try {
      if (isAnonymousUser) {
        console.log('Sending anonymous message:', messageText);
        
        const response = await chatCore.sendAnonymousMessage(conversationId, {
          text: messageText,
          type: 'text',
          sessionId: sessionId || undefined,
          senderName: user?.firstName || 'Посетитель'
        });
        
        if (response.success) {
          updateMessage(tempId, { id: response.data?.id || response.data?._id || tempId });
        } else {
          removeMessage(tempId);
          console.error('Error sending anonymous message:', response.error);
        }
      } else {
        console.log('Sending authorized message:', messageText);
        
        if (isConnected) {
          // Send via WebSocket
          emitSocketEvent('send-message', {
            conversationId,
            text: messageText,
            type: 'text',
            tempId
          });
        } else {
          // Fallback to HTTP
          const response = await chatCore.sendAnonymousMessage(conversationId, {
            text: messageText,
            sessionId: sessionId || chatCore.getUserId() || undefined,
            senderName: user?.profile?.fullName || user?.firstName || 'Посетитель'
          });
          
          if (response.success) {
            updateMessage(tempId, { id: response.data?.id || response.data?._id || tempId });
          } else {
            removeMessage(tempId);
            console.error('Error sending message via HTTP:', response.error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      removeMessage(tempId);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !conversationId) return;
    
    if (file.size > maxFileSize) {
      alert(`Файл слишком большой. Максимальный размер: ${maxFileSize / (1024 * 1024)}MB`);
      return;
    }
    
    try {
      const response = await chatCore.uploadFile(conversationId, file);
      
      if (response.success) {
        const fileMessage: Message = {
          id: Date.now().toString(),
          content: `Файл: ${file.name}`,
          timestamp: new Date(),
          sender: 'user',
          type: 'file',
          attachments: [response.data.url]
        };
        
        addMessage(fileMessage);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle rating submission
  const handleRating = async (rating: number, comment?: string) => {
    if (!operatorInfo || !isAuthenticated) return;
    
    try {
      await chatCore.createRating({
        operatorId: operatorInfo.id,
        rating,
        comment: comment || '',
        conversationId: conversationId || undefined
      });
      
      setShowRatingModal(false);
      addMessage({
        id: Date.now().toString(),
        content: `Спасибо за оценку! Ваша оценка: ${rating} звезд`,
        timestamp: new Date(),
        sender: 'operator',
        type: 'system'
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  // Handle complaint submission
  const handleComplaint = async (reason: string, details: string) => {
    if (!operatorInfo || !isAuthenticated) return;
    
    try {
      await chatCore.createComplaint({
        operatorId: operatorInfo.id,
        reason,
        details,
        conversationId: conversationId || undefined
      });
      
      setShowComplaintModal(false);
      addMessage({
        id: Date.now().toString(),
        content: 'Ваша жалоба принята и будет рассмотрена',
        timestamp: new Date(),
        sender: 'operator',
        type: 'system'
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
    }
  };

  // Widget positioning
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-800 text-white'
  };

  // Render minimized or closed state
  if (!isOpen || isMinimized) {
    return (
      <div className={`chat-widget ${positionClasses[position]} z-[99999]`}>
        <Button
          onClick={toggleWidget}
          className="rounded-full h-16 shadow-lg hover:shadow-xl transition-shadow flex items-center pr-4 pl-4"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="ml-2 text-white text-sm whitespace-nowrap">
            Написать сообщение
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`chat-widget ${positionClasses[position]} z-[99999] w-96 h-[600px] chat-widget-enter`}>
      {/* Main widget card */}
      <div className={`${themeClasses[theme]} shadow-2xl border-0 h-full flex flex-col rounded-lg overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center space-x-3">
            <Avatar 
              src={operatorInfo?.avatar || operatorAvatar} 
              alt={operatorInfo?.name || operatorName}
              size="sm" 
              className="ring-2 ring-white" 
            />
            <div>
              <div className="text-white text-sm font-medium">
                {operatorInfo?.name || operatorName}
              </div>
              <div className="text-white/80 text-xs">
                {isAuthenticated ? 'Авторизован' : (isConnected ? 'В сети' : 'Не в сети')}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={minimizeWidget}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
          {isCreatingConversation ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="md" />
              <span className="ml-2 text-sm text-gray-600">Подключение к оператору...</span>
            </div>
          ) : (
            <>
              {/* Приветственное сообщение - всегда вверху и не входит в массив сообщений */}
              {operatorInfo && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 max-w-[85%]">
                    <p className="text-sm text-blue-700 mb-1">
                      {welcomeMessage} Вас обслуживает {operatorInfo.name}.
                    </p>
                    <div className="text-xs text-blue-500">
                      Система поддержки
                    </div>
                  </div>
                </div>
              )}
              
              {/* Обычные сообщения чата, фильтруем системные приветственные сообщения */}
              {messages.filter(message => 
                !(message.type === 'system' && (
                  message.content.includes('Добро пожаловать') ||
                  message.content.includes('обслуживает') ||
                  message.content.includes('Как могу помочь') ||
                  message.content.includes('Вас обслуживает')
                ))
              ).map((message) => (
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
                    <div className="text-xs opacity-70 mt-1 flex items-center justify-between">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.sender === 'user' && (
                        <span className="ml-2">
                          {message.isRead ? (
                            <span className="text-blue-300" title="Прочитано">✓✓</span>
                          ) : (
                            <span className="text-gray-400" title="Доставлено">✓</span>
                          )}
                        </span>
                      )}
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
            </>
          )}
        </div>
        
        {/* Input area */}
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
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="p-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Action buttons */}
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
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        apiUrl={apiUrl}
        onAuthSuccess={(token, userData) => {
          // Update auth store
          useAuthStore.getState().setAuth(token, userData);
          setShowAuthModal(false);
        }}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={user}
        onLogout={() => {
          useAuthStore.getState().logout();
          setShowProfileModal(false);
        }}
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
    </div>
  );
};

export default ChatWidget;