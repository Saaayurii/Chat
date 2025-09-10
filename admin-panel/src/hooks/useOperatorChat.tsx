"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@/hooks/useChat";
import { useUnreadMessages } from "@/contexts/UnreadMessagesContext";

interface SenderType {
  id: string;
  name: string;
  type: "operator" | "visitor";
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

var useOperatorChat = (user: any) => {
  var queryClient = useQueryClient();
  var { decrementUnreadCount } = useUnreadMessages();
  var {
    sendChatMessage,
    joinConversation,
    leaveConversation,
    markConversationAsRead,
  } = useChat();

  var { 0: selectedSender, 1: setSelectedSender } = useState<SenderType | null>(null);
  var { 0: selectedConversation, 1: setSelectedConversation } = useState<string | null>(null);
  var { 0: searchQuery, 1: setSearchQuery } = useState("");
  var { 0: displayedDialogsCount, 1: setDisplayedDialogsCount } = useState(20);
  var { 0: shouldAutoScroll, 1: setShouldAutoScroll } = useState(true);
  var { 0: showTransferModal, 1: setShowTransferModal } = useState(false);
  var { 0: showRequestBlockModal, 1: setShowRequestBlockModal } = useState(false);
  var { 0: showTransferRequestModal, 1: setShowTransferRequestModal } = useState(false);
  var { 0: transferRequest, 1: setTransferRequest } = useState<any>(null);

  var messagesEndRef = useRef<HTMLDivElement>(null);
  var messagesContainerRef = useRef<HTMLDivElement>(null);
  var observerRef = useRef<IntersectionObserver | null>(null);

  var calculateUnreadCount = useCallback(
    (conversationId: string, conversations: any[]) => {
      var cachedMessages = queryClient.getQueryData(["messages", conversationId]);

      return cachedMessages && Array.isArray(cachedMessages) ? 
        cachedMessages.filter((msg: any) => {
          var actualSenderId = msg.senderId;
          const isObjectId = typeof actualSenderId === "string" && actualSenderId.includes("ObjectId");
          actualSenderId = isObjectId ? (() => {
            var idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
            return idMatch ? idMatch[1] : actualSenderId;
          })() : actualSenderId;

          var isNotMyMessage = actualSenderId !== user?.id;
          var isUnread = !msg.isRead && (!msg.readBy || !msg.readBy.includes(user?.id));

          return isNotMyMessage && isUnread;
        }).length :
        (conversations && Array.isArray(conversations) ? (() => {
          var conversation = conversations.find(
            (conv) => conv._id === conversationId || (conv as any).id === conversationId
          );
          return conversation && conversation.unreadByParticipant && user?.id ? 
            conversation.unreadByParticipant[user.id] || 0 : 0;
        })() : 0);
    },
    [queryClient, user?.id]
  );

  var handleSenderSelect = useCallback(
    (sender: SenderType, isMobile: boolean, uiActions: any) => {
      return selectedSender?.id === sender.id && selectedSender?.conversationId === sender.conversationId ? 
        Promise.resolve() :
        Promise.resolve().then(() => {
          selectedConversation && leaveConversation(selectedConversation);
          setSelectedSender(sender);
          setSelectedConversation(sender.conversationId || null);
          isMobile && uiActions.closeChatSidebar();

          return sender.conversationId ? 
            Promise.resolve().then(() => {
              joinConversation(sender.conversationId!);
              return Promise.resolve().then(() => {
                markConversationAsRead(sender.conversationId!);
                queryClient.invalidateQueries({ queryKey: ["messages", sender.conversationId] });
                queryClient.invalidateQueries({ queryKey: ["operator-conversations"] });
                decrementUnreadCount();
              }).catch((error) => {
                console.error("Error marking messages as read:", error);
              });
            }) :
            Promise.resolve();
        });
    },
    [
      selectedSender,
      selectedConversation,
      joinConversation,
      leaveConversation,
      markConversationAsRead,
      queryClient,
      decrementUnreadCount,
    ]
  );

  var handleSendMessage = useCallback(
    (content: string, file?: File) => {
      return !selectedConversation || !content.trim() ? 
        Promise.resolve() :
        Promise.resolve().then(() => {
          sendChatMessage(selectedConversation!, content.trim());
          file && console.log("File to upload:", file);
          queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation] });
          queryClient.invalidateQueries({ queryKey: ["operator-conversations"] });
        }).catch((error) => {
          console.error("Error sending message:", error);
        });
    },
    [selectedConversation, sendChatMessage, queryClient]
  );

  var handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    var container = e.currentTarget;
    var { scrollTop, scrollHeight, clientHeight } = container;
    var isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  return {
    selectedSender,
    selectedConversation,
    searchQuery,
    setSearchQuery,
    displayedDialogsCount,
    shouldAutoScroll,
    setShouldAutoScroll,
    showTransferModal,
    setShowTransferModal,
    showRequestBlockModal,
    setShowRequestBlockModal,
    showTransferRequestModal,
    setShowTransferRequestModal,
    transferRequest,
    setTransferRequest,
    messagesEndRef,
    messagesContainerRef,
    observerRef,
    calculateUnreadCount,
    handleSenderSelect,
    handleSendMessage,
    handleScroll,
  };
};

export default useOperatorChat;