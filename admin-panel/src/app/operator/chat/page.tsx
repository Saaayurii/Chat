"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useUnreadMessages } from "@/contexts/UnreadMessagesContext";
import { useUI } from "@/contexts/UIContext";
import { UserRole, ChatUser } from "@/types";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/components/Presence/usePresence";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import UserInfoSidebar from "@/components/Chat/UserInfoSidebar";
import MessageInput from "@/components/Chat/MessageInput";
import TransferModal from "@/components/Chat/TransferModal";
import RequestBlockUserModal from "@/components/Chat/RequestBlockUserModal";
import TransferRequestModal from "@/components/Chat/TransferRequestModal";
import ChatHeader from "@/components/Chat/ChatHeader";
import MessagesArea from "@/components/Chat/MessagesArea";
import EmptyChat from "@/components/Chat/EmptyChat";
import useOperatorChat from "@/hooks/useOperatorChat";
import useOperatorQueries from "@/hooks/useOperatorQueries";
import useOperatorSenders from "@/hooks/useOperatorSenders";


var OperatorChatPageContent = () => {
  var router = useRouter();
  var { user, token } = useAuthStore();
  var { updateUnreadCount } = useUnreadMessages();
  var { state: uiState, actions: uiActions } = useUI();

  var {
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
    handleSenderSelect,
    handleSendMessage,
    handleScroll,
  } = useOperatorChat(user);

  var { 0: isMobile, 1: setIsMobile } = useState(false);

  useEffect(() => {
    var checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  var { isConnected, isConnecting, reconnect, onlineUsers } = useChat();

  var presence = usePresence({
    apiUrl:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://chat-backend-13tr.onrender.com",
    userId: user?.id || "",
    token: token || undefined,
    updateInterval: 30000,
  });

  var { conversations, conversationsLoading, transferRequests, messages, messagesLoading } =
    useOperatorQueries(user, selectedConversation);

  var { filteredSenders, displayedSenders, totalUnreadMessages, calculateUnreadCount } =
    useOperatorSenders(conversations || [], searchQuery, displayedDialogsCount, user);

  var handleTransferChat = () => setShowTransferModal(true);

  var handleRequestBlockUser = () => setShowRequestBlockModal(true);

  useEffect(() => {
    shouldAutoScroll &&
      messagesEndRef.current &&
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    transferRequests &&
      Array.isArray(transferRequests) &&
      transferRequests.length > 0 &&
      !showTransferRequestModal &&
      (() => {
        var latestRequest = transferRequests[0] as any;
        var currentRequestId = transferRequest?.id;
        latestRequest?.id &&
          latestRequest.id !== currentRequestId &&
          (() => {
            setTransferRequest(latestRequest);
            setShowTransferRequestModal(true);
          })();
      })();
  }, [transferRequests, showTransferRequestModal, transferRequest?.id]);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {isMobile && uiState.isChatSidebarOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-10 lg:hidden"
          style={{ top: "64px" }}
          onClick={uiActions.closeChatSidebar}
        />
      )}

      {isMobile && uiState.isUserInfoOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-20 lg:hidden"
          style={{ top: "64px" }}
          onClick={uiActions.closeUserInfo}
        />
      )}

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
          transferRequests &&
            Array.isArray(transferRequests) &&
            transferRequests.length > 0 &&
            (() => {
              setTransferRequest(transferRequests[0]);
              setShowTransferRequestModal(true);
            })();
        }}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onReconnect={reconnect}
        selectedSender={selectedSender}
        onSenderSelect={(sender) =>
          handleSenderSelect(sender, isMobile, uiActions)
        }
        calculateUnreadCount={calculateUnreadCount}
        onlineUsers={Array.from(onlineUsers)}
        onScroll={handleScroll}
      />

      <div className="flex-1 flex flex-col relative">
        {selectedSender && selectedConversation ? (
          <>
            <ChatHeader
              selectedSender={selectedSender}
              isMobile={isMobile}
              onBackClick={uiActions.toggleChatSidebar}
              onTransferClick={handleTransferChat}
              onBlockClick={handleRequestBlockUser}
              onInfoClick={uiActions.toggleUserInfo}
            />

            <MessagesArea
              messages={messages}
              messagesLoading={messagesLoading}
              userId={user?.id}
              isMobile={isMobile}
              shouldAutoScroll={shouldAutoScroll}
              onScroll={handleScroll}
              onScrollToBottom={() => setShouldAutoScroll(true)}
              selectedSender={selectedSender}
              conversations={conversations}
            />

            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              isMobile={isMobile}
            />
          </>
        ) : (
          <EmptyChat
            isMobile={isMobile}
            onMenuClick={uiActions.toggleChatSidebar}
            isMenuOpen={uiState.isChatSidebarOpen}
          />
        )}
      </div>

      {selectedSender && (
        <UserInfoSidebar
          isOpen={uiState.isUserInfoOpen}
          onClose={uiActions.closeUserInfo}
          selectedUser={
            {
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
                isOnline: selectedSender.isOnline,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            } as ChatUser
          }
          isMobile={isMobile}
        />
      )}

      {selectedSender && (
        <>
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            visitorId={selectedSender.id}
            visitorName={selectedSender.name}
            conversationId={selectedConversation || ""}
            onTransferComplete={() => setShowTransferModal(false)}
          />

          <RequestBlockUserModal
            isOpen={showRequestBlockModal}
            onClose={() => setShowRequestBlockModal(false)}
            userId={selectedSender.id}
            userName={selectedSender.name}
            userEmail={selectedSender.email}
            userAvatar={selectedSender.avatar}
            conversationId={selectedConversation || ""}
            onRequestComplete={() => setShowRequestBlockModal(false)}
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

var OperatorChatPage = () => (
  <ProtectedRoute requiredRole={UserRole.OPERATOR}>
    <OperatorChatPageContent />
  </ProtectedRoute>
);

export default OperatorChatPage;
