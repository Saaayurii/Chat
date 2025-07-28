'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';
import { useUI } from '@/contexts/UIContext';
import { UserRole, ChatUser } from '@/types';
import { chatAPI } from '@/core/api';
import { useChat } from '@/hooks/useChat';
import { usePresence } from '@/components/Presence/usePresence';

// UI Components
import ProtectedRoute from '@/components/ProtectedRoute';
import { ChatSidebar } from '@/components/Chat/ChatSidebar';
import UserInfoSidebar from '@/components/Chat/UserInfoSidebar';
import MessageInput from '@/components/Chat/MessageInput';
import TransferModal from '@/components/Chat/TransferModal';
import RequestBlockUserModal from '@/components/Chat/RequestBlockUserModal';
import TransferRequestModal from '@/components/Chat/TransferRequestModal';
import Button from '@/components/UI/Button';

// Icons
import { 
  Menu, 
  ArrowLeft, 
  Info, 
  ChevronDown, 
  Search,
  ArrowRightLeft,
  UserX
} from 'lucide-react';

// Types
interface SenderType {
  id: string;
  name: string;
  type: 'operator' | 'visitor';
  avatar?: string;
  unreadCount?: number;
  lastMessageTime: string | Date;
  isOnline: boolean;
  conversationId?: string;
  email: string;
  phone?: string;
  role?: string;
  isAuthorized?: boolean;
  source?: string;
}

interface LocalMessage {
  _id?: string;
  id?: string;
  senderId: string;
  conversationId: string;
  content?: string;
  text?: string;
  timestamp?: string;
  createdAt?: string | Date;
  isRead?: boolean;
  readBy?: string[];
}

function OperatorChatPageContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateUnreadCount, decrementUnreadCount } = useUnreadMessages();
  const { state: uiState, actions: uiActions } = useUI();
  const queryClient = useQueryClient();

  // Local state
  const [selectedSender, setSelectedSender] = useState<SenderType | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedDialogsCount, setDisplayedDialogsCount] = useState(20);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRequestBlockModal, setShowRequestBlockModal] = useState(false);
  const [showTransferRequestModal, setShowTransferRequestModal] = useState(false);
  const [transferRequest, setTransferRequest] = useState<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Responsive design
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Chat and WebSocket
  const {
    isConnected,
    isConnecting,
    reconnect,
    typingUsers,
    onlineUsers,
    sendChatMessage,
    joinConversation,
    leaveConversation,
    setTyping,
    markAsRead,
    markConversationAsRead
  } = useChat();

  const presence = usePresence({
    apiUrl: '/api/presence',
    userId: user?.id || '',
    updateInterval: 30000
  });

  // Queries
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['operator-conversations', user?.id],
    queryFn: async () => {
      try {
        const response = await chatAPI.getConversations();
        return response.data || []; // Извлекаем данные из AxiosResponse
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return []; // Возвращаем пустой массив в случае ошибки
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: transferRequests } = useQuery({
    queryKey: ['transfer-requests'],
    queryFn: async () => [],  // Mock empty array for now
    refetchInterval: 10000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      try {
        const response = await chatAPI.getMessages(selectedConversation);
        // API возвращает пагинированный ответ, извлекаем данные
        const responseData = response.data;
        return responseData.data || [];
      } catch (error) {
        console.error('Error fetching messages:', error);
        return []; // Возвращаем пустой массив в случае ошибки
      }
    },
    enabled: !!selectedConversation,
    refetchInterval: false,
  });

  // Calculate unread count
  const calculateUnreadCount = useCallback((conversationId: string) => {
    const cachedMessages = queryClient.getQueryData(['messages', conversationId]);
    
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

  // Filter and process senders
  const filteredSenders = useMemo(() => {
    if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
      return [];
    }

    const sendersMap = new Map<string, SenderType>();
    
    conversations.forEach((conversation: any) => {
      const conversationId = conversation._id || (conversation as any).id;
      const participants = conversation.participants || [];
      
      let displayParticipants = [];
      
      if (conversation.type === 'anonymous-support' && (conversation as any).anonymousUser) {
        displayParticipants = [(conversation as any).anonymousUser];
      } else {
        displayParticipants = participants.filter(
          (participant: any) => (participant._id || participant.id) !== user?.id
        );
      }

      displayParticipants.forEach((participant: any) => {
        const participantKey = participant._id || participant.id;
        const lastMessage = conversation.lastMessage;
        const lastMessageTime = lastMessage?.timestamp || conversation.createdAt;
        
        const actualUnreadCount = calculateUnreadCount(conversationId);
        const originalUnreadCount = conversation.unreadMessagesCount || 0;
        const finalUnreadCount = Math.max(actualUnreadCount, originalUnreadCount);
        
        const existingSender = sendersMap.get(participantKey);
        
        if (!existingSender || new Date(lastMessageTime) > new Date(existingSender.lastMessageTime)) {
          sendersMap.set(participantKey, {
            id: participant._id || participant.id,
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

    const filtered = senders.filter((sender) =>
      sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sender.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aUnreadCount = a.conversationId 
        ? Math.max(calculateUnreadCount(a.conversationId), a.unreadCount || 0)
        : (a.unreadCount || 0);
      const bUnreadCount = b.conversationId 
        ? Math.max(calculateUnreadCount(b.conversationId), b.unreadCount || 0)
        : (b.unreadCount || 0);
      
      if (aUnreadCount > 0 && bUnreadCount === 0) return -1;
      if (aUnreadCount === 0 && bUnreadCount > 0) return 1;
      
      if (aUnreadCount > 0 && bUnreadCount > 0) {
        const unreadDiff = bUnreadCount - aUnreadCount;
        if (unreadDiff !== 0) return unreadDiff;
      }
      
      const aTime = new Date(a.lastMessageTime).getTime();
      const bTime = new Date(b.lastMessageTime).getTime();
      return bTime - aTime;
    });
  }, [conversations, searchQuery, user?.id, calculateUnreadCount]);

  const displayedSenders = useMemo(() => {
    return filteredSenders.slice(0, displayedDialogsCount);
  }, [filteredSenders, displayedDialogsCount]);

  const totalUnreadMessages = useMemo(() => {
    return filteredSenders.reduce((total, sender) => {
      const actualUnreadCount = sender.conversationId 
        ? Math.max(calculateUnreadCount(sender.conversationId), sender.unreadCount || 0)
        : (sender.unreadCount || 0);
      return total + actualUnreadCount;
    }, 0);
  }, [filteredSenders, calculateUnreadCount]);

  // Handle sender selection
  const handleSenderSelect = useCallback(async (sender: SenderType) => {
    if (selectedSender?.id === sender.id && selectedSender?.conversationId === sender.conversationId) {
      return;
    }

    if (selectedConversation) {
      leaveConversation(selectedConversation);
    }

    setSelectedSender(sender);
    setSelectedConversation(sender.conversationId || null);
    
    if (isMobile) {
      uiActions.closeChatSidebar();
    }

    if (sender.conversationId) {
      joinConversation(sender.conversationId);
      
      try {
        // Используем markConversationAsRead из useChat
        markConversationAsRead(sender.conversationId);
        queryClient.invalidateQueries({ queryKey: ['messages', sender.conversationId] });
        queryClient.invalidateQueries({ queryKey: ['operator-conversations'] });
        // Update unread count - this should be handled by the context
        decrementUnreadCount();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }, [selectedSender, selectedConversation, isMobile, uiActions, joinConversation, leaveConversation, markConversationAsRead, queryClient, updateUnreadCount]);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      // Используем sendChatMessage из useChat
      sendChatMessage(selectedConversation, content.trim());

      if (file) {
        // Handle file upload logic here if needed
        console.log('File to upload:', file);
      }

      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['operator-conversations'] });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [selectedConversation, sendChatMessage, queryClient]);

  // Handle transfer and block actions
  const handleTransferChat = useCallback(() => {
    setShowTransferModal(true);
  }, []);

  const handleRequestBlockUser = useCallback(() => {
    setShowRequestBlockModal(true);
  }, []);

  const handleTransferComplete = useCallback(() => {
    setShowTransferModal(false);
    queryClient.invalidateQueries({ queryKey: ['operator-conversations'] });
  }, [queryClient]);

  const handleRequestBlockComplete = useCallback(() => {
    setShowRequestBlockModal(false);
    queryClient.invalidateQueries({ queryKey: ['operator-conversations'] });
  }, [queryClient]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Auto scroll effect
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Transfer requests effect
  useEffect(() => {
    if (transferRequests && Array.isArray(transferRequests) && transferRequests.length > 0 && !showTransferRequestModal) {
      const latestRequest = transferRequests[0] as any;
      const currentRequestId = transferRequest?.id;
      if (latestRequest?.id && latestRequest.id !== currentRequestId) {
        setTransferRequest(latestRequest);
        setShowTransferRequestModal(true);
      }
    }
  }, [transferRequests, showTransferRequestModal, transferRequest?.id]);

  // Render messages
  const renderMessages = () => {
    if (!messages || !Array.isArray(messages)) return null;

    return messages.map((message: any) => {
      let actualSenderId = message.senderId;
      if (typeof actualSenderId === 'string' && actualSenderId.includes('ObjectId')) {
        const idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
        if (idMatch) {
          actualSenderId = idMatch[1];
        }
      }

      const isMyMessage = actualSenderId === user?.id;
      let senderRole = 'visitor';
      
      if (selectedSender?.conversationId && conversations) {
        const conversation = conversations.find((conv: any) => 
          (conv._id === selectedSender.conversationId || (conv as any).id === selectedSender.conversationId)
        );
        if (conversation) {
          const participant = conversation.participants?.find((p: any) => (p.id || p._id) === actualSenderId) as any;
          if (participant && typeof participant === 'object' && participant.role) {
            senderRole = participant.role || 'visitor';
          }
        }
      }
      
      const isOperatorMessage = isMyMessage || senderRole === 'operator' || senderRole === 'admin';
      
      return (
        <div
          key={message._id || message.id}
          data-message-id={message._id || message.id}
          data-sender-id={actualSenderId}
          className={`flex ${isOperatorMessage ? "justify-end" : "justify-start"}`}
          ref={(el) => {
            if (el && observerRef.current) {
              observerRef.current.observe(el);
            }
          }}
        >
          <div
            className={`${
              isMobile ? 'max-w-[85%]' : 'max-w-xs lg:max-w-md'
            } px-3 sm:px-4 py-2 rounded-lg ${
              isOperatorMessage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 border border-gray-200 text-gray-800"
            }`}
          >
            <p className={`${isMobile ? 'text-base' : 'text-sm'} leading-relaxed`}>
              {message.content || message.text}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p
                className={`text-xs ${
                  isOperatorMessage ? "text-blue-200" : "text-gray-500"
                }`}
              >
                {new Date(message.timestamp || message.createdAt || new Date()).toLocaleTimeString()}
              </p>
              <div className="flex items-center space-x-1">
                {(() => {
                  const readByCount = message.readBy ? message.readBy.length : 0;
                  const isReadByRecipient = message.readBy && message.readBy.some((id: string) => id !== actualSenderId);
                  const isFullyRead = message.isRead || isReadByRecipient;
                  
                  if (isOperatorMessage) {
                    if (isFullyRead) {
                      return (
                        <div className="flex items-center space-x-1">
                          <span className="text-blue-200">✓✓</span>
                        </div>
                      );
                    } else if (readByCount > 0) {
                      return <span className="text-blue-300">✓</span>;
                    } else {
                      return <span className="text-blue-400">✓</span>;
                    }
                  } else {
                    if (isFullyRead) {
                      return (
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600">✓✓</span>
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
    });
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Backdrop for mobile panels */}
      {isMobile && uiState.isChatSidebarOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-10 lg:hidden"
          style={{ top: '64px' }}
          onClick={uiActions.closeChatSidebar}
        />
      )}
      
      {isMobile && uiState.isUserInfoOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-20 lg:hidden"
          style={{ top: '64px' }}
          onClick={uiActions.closeUserInfo}
        />
      )}

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={uiState.isChatSidebarOpen}
        onClose={uiActions.closeChatSidebar}
        isMobile={isMobile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredSenders={filteredSenders}
        displayedSenders={displayedSenders}
        conversationsLoading={conversationsLoading}
        totalUnreadMessages={totalUnreadMessages}
        transferRequests={transferRequests || []}
        onTransferRequestClick={() => {
          if (transferRequests && Array.isArray(transferRequests) && transferRequests.length > 0) {
            setTransferRequest(transferRequests[0]);
            setShowTransferRequestModal(true);
          }
        }}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onReconnect={reconnect}
        selectedSender={selectedSender}
        onSenderSelect={handleSenderSelect}
        calculateUnreadCount={calculateUnreadCount}
        onlineUsers={Array.from(onlineUsers)}
        onScroll={handleScroll}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedSender && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mobile back button */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={uiActions.toggleChatSidebar}
                      className="h-8 w-8 lg:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {selectedSender.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedSender.isOnline ? 'В сети' : 'Не в сети'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Action buttons for visitors */}
                  {selectedSender.type === 'visitor' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleTransferChat}
                        className="h-8 w-8"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRequestBlockUser}
                        className="h-8 w-8"
                        title="Запросить блокировку пользователя"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  {/* User info toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={uiActions.toggleUserInfo}
                    className="h-8 w-8"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
              style={{ paddingBottom: isMobile ? '180px' : '20px' }}
              onScroll={handleScroll}
            >
              {messagesLoading ? (
                <div className="flex justify-center">
                  <div className="text-muted-foreground">Загрузка сообщений...</div>
                </div>
              ) : (
                renderMessages()
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {!shouldAutoScroll && (
              <div className={`absolute right-4 z-20 ${isMobile ? 'bottom-48' : 'bottom-20'}`}>
                <Button
                  onClick={() => {
                    setShouldAutoScroll(true);
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full shadow-lg"
                  size="icon"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              isMobile={isMobile}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background relative">
            {/* Mobile menu button when no chat selected */}
            {isMobile && !uiState.isChatSidebarOpen && (
              <div className="absolute top-4 left-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={uiActions.toggleChatSidebar}
                  className="h-10 w-10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            )}
            <div className="text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Выберите чат
              </h3>
              {isMobile && (
                <p className="text-sm text-muted-foreground">
                  Нажмите на меню, чтобы выбрать чат
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Info Sidebar */}
      {selectedSender && (
        <UserInfoSidebar
          isOpen={uiState.isUserInfoOpen}
          onClose={uiActions.closeUserInfo}
          selectedUser={{
            _id: selectedSender.id,
            id: selectedSender.id,
            email: selectedSender.email,
            role: (selectedSender.role as UserRole) || UserRole.VISITOR,
            isActivated: selectedSender.isAuthorized || false,
            isBlocked: false,
            blacklistedByAdmin: false,
            blacklistedByOperator: false,
            profile: {
              username: selectedSender.name,
              fullName: selectedSender.name,
              phone: selectedSender.phone,
              avatarUrl: selectedSender.avatar,
              bio: undefined,
              lastSeenAt: new Date(),
              isOnline: selectedSender.isOnline
            },
            createdAt: new Date(),
            updatedAt: new Date()
          } as ChatUser}
          isMobile={isMobile}
        />
      )}

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

          <RequestBlockUserModal
            isOpen={showRequestBlockModal}
            onClose={() => setShowRequestBlockModal(false)}
            userId={selectedSender?.id || ""}
            userName={selectedSender?.name || ""}
            userEmail={selectedSender?.email || ""}
            userAvatar={selectedSender?.avatar}
            conversationId={selectedConversation || ""}
            onRequestComplete={handleRequestBlockComplete}
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
}

export default function OperatorChatPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.OPERATOR}>
      <OperatorChatPageContent />
    </ProtectedRoute>
  );
}