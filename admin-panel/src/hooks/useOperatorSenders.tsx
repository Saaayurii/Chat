"use client";

import { useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

var useOperatorSenders = (
  conversations: any[],
  searchQuery: string,
  displayedDialogsCount: number,
  user: any
) => {
  var queryClient = useQueryClient();

  var calculateUnreadCount = useCallback(
    (conversationId: string, convs: any[]) => {
      var cachedMessages = queryClient.getQueryData(["messages", conversationId]);

      return cachedMessages && Array.isArray(cachedMessages)
        ? cachedMessages.filter((msg: any) => {
            var actualSenderId = msg.senderId;
            var isObjectId = typeof actualSenderId === "string" && actualSenderId.includes("ObjectId");
            actualSenderId = isObjectId
              ? (() => {
                  var idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
                  return idMatch ? idMatch[1] : actualSenderId;
                })()
              : actualSenderId;

            var isNotMyMessage = actualSenderId !== user?.id;
            var isUnread = !msg.isRead && (!msg.readBy || !msg.readBy.includes(user?.id));

            return isNotMyMessage && isUnread;
          }).length
        : convs && Array.isArray(convs)
        ? (() => {
            var conversation = convs.find(
              (conv) => conv._id === conversationId || (conv as any).id === conversationId
            );
            return conversation && conversation.unreadByParticipant && user?.id
              ? conversation.unreadByParticipant[user.id] || 0
              : 0;
          })()
        : 0;
    },
    [queryClient, user?.id]
  );

  var filteredSenders = useMemo(() => {
    return !conversations || !Array.isArray(conversations) || conversations.length === 0
      ? []
      : (() => {
          var sendersMap = new Map<string, SenderType>();

          conversations.forEach((conversation: any) => {
            var conversationId = conversation._id || (conversation as any).id;
            var participants = conversation.participants || [];

            var displayParticipants =
              conversation.type === "anonymous-support" && (conversation as any).anonymousUser
                ? [(conversation as any).anonymousUser]
                : participants.filter(
                    (participant: any) => (participant._id || participant.id) !== user?.id
                  );

            displayParticipants.forEach((participant: any) => {
              var participantKey = participant._id || participant.id;
              var lastMessage = conversation.lastMessage;
              var lastMessageTime = lastMessage?.timestamp || conversation.createdAt;

              var actualUnreadCount = calculateUnreadCount(conversationId, conversations);
              var originalUnreadCount = conversation.unreadMessagesCount || 0;
              var finalUnreadCount = Math.max(actualUnreadCount, originalUnreadCount);

              var existingSender = sendersMap.get(participantKey);

              (!existingSender ||
                new Date(lastMessageTime) > new Date(existingSender.lastMessageTime)) &&
                sendersMap.set(participantKey, {
                  id: participant._id || participant.id,
                  name:
                    participant.profile?.fullName ||
                    participant.profile?.username ||
                    participant.email ||
                    "Анонимный",
                  type:
                    participant.role === "operator" || participant.role === "admin"
                      ? "operator"
                      : "visitor",
                  avatar: participant.profile?.avatarUrl,
                  unreadCount: finalUnreadCount,
                  lastMessageTime: lastMessageTime,
                  isOnline: participant.profile?.isOnline || false,
                  conversationId: conversationId,
                  email: participant.email || "",
                  phone: participant.profile?.phone || "",
                  role: participant.role || "visitor",
                  isAuthorized: participant.isActivated || false,
                  source: participant.profile?.source || "website",
                });
            });
          });

          var senders = Array.from(sendersMap.values());
          var filtered = senders.filter(
            (sender) =>
              sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sender.email.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return filtered.sort((a, b) => {
            var aUnreadCount = a.conversationId
              ? Math.max(calculateUnreadCount(a.conversationId, conversations), a.unreadCount || 0)
              : a.unreadCount || 0;
            var bUnreadCount = b.conversationId
              ? Math.max(calculateUnreadCount(b.conversationId, conversations), b.unreadCount || 0)
              : b.unreadCount || 0;

            return aUnreadCount > 0 && bUnreadCount === 0
              ? -1
              : aUnreadCount === 0 && bUnreadCount > 0
              ? 1
              : aUnreadCount > 0 && bUnreadCount > 0
              ? (() => {
                  var unreadDiff = bUnreadCount - aUnreadCount;
                  return unreadDiff !== 0
                    ? unreadDiff
                    : (() => {
                        var aTime = new Date(a.lastMessageTime).getTime();
                        var bTime = new Date(b.lastMessageTime).getTime();
                        return bTime - aTime;
                      })();
                })()
              : (() => {
                  var aTime = new Date(a.lastMessageTime).getTime();
                  var bTime = new Date(b.lastMessageTime).getTime();
                  return bTime - aTime;
                })();
          });
        })();
  }, [conversations, searchQuery, user?.id, calculateUnreadCount]);

  var displayedSenders = useMemo(() => {
    return filteredSenders.slice(0, displayedDialogsCount);
  }, [filteredSenders, displayedDialogsCount]);

  var totalUnreadMessages = useMemo(() => {
    return filteredSenders.reduce((total, sender) => {
      var actualUnreadCount = sender.conversationId
        ? Math.max(calculateUnreadCount(sender.conversationId, conversations), sender.unreadCount || 0)
        : sender.unreadCount || 0;
      return total + actualUnreadCount;
    }, 0);
  }, [filteredSenders, calculateUnreadCount, conversations]);

  return {
    filteredSenders,
    displayedSenders,
    totalUnreadMessages,
    calculateUnreadCount,
  };
};

export default useOperatorSenders;