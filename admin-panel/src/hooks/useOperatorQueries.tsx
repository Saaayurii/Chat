"use client";

import { useQuery } from "@tanstack/react-query";
import { chatAPI } from "@/core/api";
import { CachedResponse, PaginatedResponse, Message } from "@/types";

var useOperatorQueries = (user: any, selectedConversation: string | null) => {
  var { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["operator-conversations", user?.id],
    queryFn: () => {
      return chatAPI
        .getConversations()
        .then((response) => response.data || [])
        .catch((error) => {
          console.error("Error fetching conversations:", error);
          return [];
        });
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  var { data: transferRequests } = useQuery({
    queryKey: ["transfer-requests"],
    queryFn: () => Promise.resolve([]),
    refetchInterval: 10000,
  });

  var { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversation],
    queryFn: () => {
      return !selectedConversation
        ? Promise.resolve([])
        : chatAPI
            .getMessages(selectedConversation)
            .then((response) => {
              var responseData = response.data as unknown;
              console.log("Messages API response:", responseData);

              var isCachedResponse = (
                data: unknown
              ): data is CachedResponse<Message> => {
                return (
                  typeof data === "object" &&
                  data !== null &&
                  "messages" in data &&
                  "fromCache" in data &&
                  "cacheInfo" in data
                );
              };

              var isPaginatedResponse = (
                data: unknown
              ): data is PaginatedResponse<Message> => {
                return (
                  typeof data === "object" &&
                  data !== null &&
                  "data" in data &&
                  "total" in data &&
                  "page" in data
                );
              };

              return Array.isArray(responseData)
                ? responseData
                : isPaginatedResponse(responseData)
                ? responseData.data
                : isCachedResponse(responseData)
                ? responseData.messages
                : (() => {
                    console.warn("Unexpected response format:", responseData);
                    return [];
                  })();
            })
            .catch((error) => {
              console.error("Error fetching messages:", error);
              return [];
            });
    },
    enabled: !!selectedConversation,
    refetchInterval: false,
  });

  return {
    conversations,
    conversationsLoading,
    transferRequests,
    messages,
    messagesLoading,
  };
};

export default useOperatorQueries;