"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { chatAPI } from "@/core/api";
import { useChat } from "@/hooks/useChat";
import { UserRole } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import ChatHeader from "@/components/Chat/ChatHeader";
import MessagesArea from "@/components/Chat/MessagesArea";
import EmptyChat from "@/components/Chat/EmptyChat";
import UserInfoSidebar from "@/components/Chat/UserInfoSidebar";
import { usePresence } from "@/components/Presence";

interface SenderType {
  id: string;
  name: string;
  type: "operator" | "visitor" | "admin";
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

var AdminChatPageContent = () => {
  var { user, token } = useAuthStore();

  var { 0: selectedConversation, 1: setSelectedConversation } = useState<string | null>(null);
  var { 0: searchQuery, 1: setSearchQuery } = useState("");
  var { 0: selectedSender, 1: setSelectedSender } = useState<SenderType | null>(null);

  var {
    isConnected,
    isConnecting,
    typingUsers,
    sendChatMessage,
    setTyping,
    joinConversation,
    leaveConversation,
    reconnect,
  } = useChat();

  var presence = usePresence({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
    userId: user?.id || "anonymous",
    token: token || undefined,
    autoConnect: !!user,
    enableCrossTabSync: true,
  });

  var { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: () => Promise.resolve(chatAPI.getConversations().then(response => response.data)),
  });

  var { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["admin-messages", selectedConversation],
    queryFn: () => selectedConversation ? 
      Promise.resolve(chatAPI.getMessages(selectedConversation).then(response => response.data)) : 
      Promise.resolve(null),
    enabled: !!selectedConversation,
  });

  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation);
      return () => {
        selectedConversation && leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation, joinConversation, leaveConversation]);

  var filteredSenders = useMemo(() => {
    return !conversations || !Array.isArray(conversations) ? [] : (() => {
      var sendersMap = new Map();
      conversations.forEach((conv) => {
        conv.participants && Array.isArray(conv.participants) ?
          conv.participants.forEach((participant: any) => {
            participant && participant.id !== user?.id ? (() => {
              var senderId = participant.id;
              var existingSender = sendersMap.get(senderId);

              !existingSender ||
              new Date(conv.lastMessage?.timestamp || 0) >
                new Date(existingSender.lastMessageTime || 0) ? (() => {
                var type: "operator" | "visitor" | "admin" = participant.role === UserRole.OPERATOR ? "operator" :
                  participant.role === UserRole.ADMIN ? "admin" : "visitor";

                sendersMap.set(senderId, {
                  id: senderId,
                  name: participant.profile?.fullName ||
                    participant.profile?.username ||
                    "Неизвестный",
                  type,
                  avatar: participant.profile?.avatarUrl,
                  unreadCount: conv.unreadMessagesCount || 0,
                  lastMessageTime: conv.lastMessage?.timestamp || new Date().toISOString(),
                  isOnline: participant.profile?.isOnline || false,
                  conversationId: conv._id,
                  email: participant.email || "",
                  phone: participant.profile?.phone || "",
                  role: participant.role || "VISITOR",
                  isAuthorized: participant.isActivated || false,
                  source: "Веб-сайт",
                });
              })() : null;
            })() : null;
          }) : null;
      });

      var senders = Array.from(sendersMap.values());
      senders.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      return searchQuery.trim() ? (() => {
        var query = searchQuery.toLowerCase();
        return senders.filter(sender => 
          sender.name.toLowerCase().includes(query) ||
          sender.email.toLowerCase().includes(query)
        );
      })() : senders;
    })();
  }, [conversations, searchQuery, user?.id]);

  var currentTypingUsers = useMemo(() => 
    selectedConversation ? typingUsers[selectedConversation] || [] : []
  , [selectedConversation, typingUsers]);

  var totalUnreadMessages = useMemo(() =>
    filteredSenders.reduce((total, sender) => total + (sender.unreadCount || 0), 0)
  , [filteredSenders]);

  var handleSenderSelect = (sender: SenderType) => {
    setSelectedSender(sender);
    setSelectedConversation(sender.conversationId || null);
  };

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredSenders={filteredSenders}
        selectedSender={selectedSender}
        onSenderSelect={handleSenderSelect}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onReconnect={reconnect}
        conversationsLoading={conversationsLoading}
        totalUnreadMessages={totalUnreadMessages}
        onlineUsers={presence.onlineUsers}
      />

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <ChatHeader
                selectedSender={selectedSender ? {
                  name: selectedSender.name,
                  type: selectedSender.type === "admin" ? "operator" : selectedSender.type as "operator" | "visitor",
                  isOnline: selectedSender.isOnline
                } : null}
                isMobile={false}
                onBackClick={() => {}}
                onTransferClick={() => {}}
                onBlockClick={() => {}}
                onInfoClick={() => {}}
              />
              <MessagesArea
                messages={messages?.data || null}
                messagesLoading={messagesLoading}
                userId={user?.id}
                isMobile={false}
                shouldAutoScroll={true}
                onScroll={() => {}}
                onScrollToBottom={() => {}}
                selectedSender={selectedSender}
                conversations={conversations}
              />
            </>
          ) : (
            <EmptyChat isMobile={false} onMenuClick={() => {}} isMenuOpen={false} />
          )}
        </div>

        {selectedSender ? (
          <UserInfoSidebar 
            isOpen={true}
            onClose={() => {}}
            selectedUser={null}
            isMobile={false}
          />
        ) : null}
      </div>
    </div>
  );
};

export default function AdminChatPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminChatPageContent />
    </ProtectedRoute>
  );
}