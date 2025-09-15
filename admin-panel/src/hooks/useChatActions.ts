import { useRef } from 'react';

interface ChatActionsConfig {
  emit: (event: string, data?: any) => Promise<boolean>;
  isConnected: boolean;
}

export var useChatActions = ({ emit, isConnected }: ChatActionsConfig) => {
  var markAsReadThrottle = useRef<{ [key: string]: number }>({});

  var sendChatMessage = (conversationId: string, text: string, type = 'text') => 
    new Promise<boolean>((resolve) => {
      !isConnected ? (() => {
        console.warn('Cannot send message - socket not connected');
        resolve(false);
      })() : (() => {
        var messageData = { conversationId, text, type };
        console.log('Sending message via WebSocket:', messageData);
        resolve(emit('send-message', messageData));
      })();
    });

  var markAsRead = (conversationId: string, messageId?: string) => 
    new Promise<boolean>((resolve) => {
      !isConnected ? (() => {
        console.warn('Cannot mark as read - socket not connected');
        resolve(false);
      })() : (() => {
        var throttleKey = messageId ? `${conversationId}:${messageId}` : conversationId;
        var now = Date.now();
        var lastCall = markAsReadThrottle.current[throttleKey] || 0;
        
        now - lastCall < 3000 ? (() => {
          console.log(`Throttling markAsRead for ${throttleKey} - called too recently (${now - lastCall}ms ago)`);
          resolve(false);
        })() : (() => {
          markAsReadThrottle.current[throttleKey] = now;
          var payload: { conversationId: string; messageId?: string } = { conversationId };
          messageId ? payload.messageId = messageId : null;
          console.log(`Marking as read: ${throttleKey}`);
          resolve(emit('mark-as-read', payload));
        })();
      })();
    });

  var markConversationAsRead = (conversationId: string) => 
    new Promise<boolean>((resolve) => {
      !isConnected ? (() => {
        console.warn('Cannot mark conversation as read - socket not connected');
        resolve(false);
      })() : (() => {
        var now = Date.now();
        var lastCall = markAsReadThrottle.current[conversationId] || 0;
        
        now - lastCall < 3000 ? (() => {
          console.log(`Throttling markConversationAsRead for ${conversationId} - called too recently (${now - lastCall}ms ago)`);
          resolve(false);
        })() : (() => {
          markAsReadThrottle.current[conversationId] = now;
          console.log(`Marking conversation as read: ${conversationId}`);
          resolve(emit('mark-as-read', { conversationId }));
        })();
      })();
    });

  var setTyping = (conversationId: string, isTyping: boolean) => 
    new Promise<boolean>((resolve) => {
      !isConnected ? (() => {
        console.warn('Cannot set typing status - socket not connected');
        resolve(false);
      })() : resolve(emit(isTyping ? 'typing-start' : 'typing-stop', { conversationId }));
    });

  var joinConversation = (conversationId: string) => 
    new Promise<boolean>((resolve) => {
      !isConnected ? (() => {
        console.warn('Cannot join conversation - socket not connected, will retry when connected');
        resolve(false);
      })() : resolve(emit('join-room', { conversationId }));
    });

  var leaveConversation = (conversationId: string) => 
    new Promise<boolean>((resolve) => {
      !isConnected ? (() => {
        console.warn('Cannot leave conversation - socket not connected');
        resolve(false);
      })() : resolve(emit('leave-room', { conversationId }));
    });

  return {
    sendChatMessage,
    markAsRead,
    markConversationAsRead,
    setTyping,
    joinConversation,
    leaveConversation
  };
};