"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import Button from "@/components/UI/Button";

interface Message {
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

interface MessagesAreaProps {
  messages: Message[] | null;
  messagesLoading: boolean;
  userId?: string;
  isMobile: boolean;
  shouldAutoScroll: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onScrollToBottom: () => void;
  selectedSender?: any;
  conversations?: any[];
}

var MessagesArea = ({ 
  messages, 
  messagesLoading, 
  userId, 
  isMobile, 
  shouldAutoScroll,
  onScroll,
  onScrollToBottom,
  selectedSender,
  conversations
}: MessagesAreaProps) => {
  var messagesEndRef = useRef<HTMLDivElement>(null);
  var messagesContainerRef = useRef<HTMLDivElement>(null);

  var renderMessages = () => {
    return !messages || !Array.isArray(messages) ? null : messages.map((message: any) => {
      var actualSenderId = message.senderId;
      const isObjectId = typeof actualSenderId === "string" && actualSenderId.includes("ObjectId");
      actualSenderId = isObjectId ? (() => {
        var idMatch = actualSenderId.match(/ObjectId\('([^']+)'\)/);
        return idMatch ? idMatch[1] : actualSenderId;
      })() : actualSenderId;

      var isMyMessage = actualSenderId === userId;
      var senderRole = "visitor";

      const conversation = selectedSender?.conversationId && conversations ? 
        conversations.find((conv: any) =>
          conv._id === selectedSender.conversationId ||
          (conv as any).id === selectedSender.conversationId
        ) : null;

      const participant = conversation ? 
        conversation.participants?.find((p: any) => (p.id || p._id) === actualSenderId) : null;
      
      senderRole = participant && typeof participant === "object" && participant.role ? 
        participant.role : "visitor";

      var isOperatorMessage = isMyMessage || senderRole === "operator" || senderRole === "admin";

      return (
        <div
          key={message._id || message.id}
          data-message-id={message._id || message.id}
          data-sender-id={actualSenderId}
          className={`flex ${isOperatorMessage ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${isMobile ? "max-w-[85%]" : "max-w-xs lg:max-w-md"} px-3 sm:px-4 py-2 rounded-lg ${
              isOperatorMessage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 border border-gray-200 text-gray-800"
            }`}
          >
            <p className={`${isMobile ? "text-base" : "text-sm"} leading-relaxed`}>
              {message.text || message.content}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs ${isOperatorMessage ? "text-blue-200" : "text-gray-500"}`}>
                {new Date(message.createdAt || message.timestamp || new Date()).toLocaleTimeString()}
              </p>
              <div className="flex items-center space-x-1">
                {(() => {
                  var readByCount = message.readBy ? message.readBy.length : 0;
                  var isReadByRecipient = message.readBy && 
                    message.readBy.some((id: string) => id !== actualSenderId);
                  var isFullyRead = message.isRead || isReadByRecipient;

                  return isOperatorMessage ? 
                    (isFullyRead ? 
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-200">✓✓</span>
                      </div> : 
                      (readByCount > 0 ? 
                        <span className="text-blue-300">✓</span> : 
                        <span className="text-blue-400">✓</span>
                      )
                    ) :
                    (isFullyRead ? 
                      <div className="flex items-center space-x-1">
                        <span className="text-green-600">✓✓</span>
                      </div> : 
                      (readByCount > 0 ? 
                        <span className="text-green-500">✓</span> : 
                        <span className="text-gray-400">✓</span>
                      )
                    );
                })()}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
      style={{ paddingBottom: isMobile ? "180px" : "20px" }}
      onScroll={onScroll}
    >
      {messagesLoading ? (
        <div className="flex justify-center">
          <div className="text-muted-foreground">Загрузка сообщений...</div>
        </div>
      ) : (
        renderMessages()
      )}

      <div ref={messagesEndRef} />

      {!shouldAutoScroll && (
        <div className={`absolute right-4 z-20 ${isMobile ? "bottom-48" : "bottom-20"}`}>
          <Button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              onScrollToBottom();
            }}
            className="rounded-full shadow-lg"
            size="icon"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessagesArea;