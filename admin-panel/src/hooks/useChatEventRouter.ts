import { useRef, useCallback } from 'react';

interface EventHandlers {
  handleNewMessage?: (data: any) => Promise<void>;
  handleMessageRead?: (data: any) => Promise<void>;
  handleConversationRead?: (data: any) => Promise<void>;
  handleMarkAsReadSuccess?: (data: any) => Promise<void>;
  handleUserTyping?: (data: any) => Promise<void>;
  handleConversationUpdated?: (data: any) => Promise<void>;
  handleUserOnline?: (data: any) => Promise<void>;
  handleNewConversationAssigned?: (data: any) => Promise<void>;
  handleMessagesRead?: (data: any) => Promise<void>;
  handleSingleMessageRead?: (data: any) => Promise<void>;
  handleConversationRemoved?: (data: any) => Promise<void>;
  handleConversationAssigned?: (data: any) => Promise<void>;
}

export var useChatEventRouter = (handlers: EventHandlers) => {
  var handlersRef = useRef<EventHandlers>({});

  var handleSocketIOMessage = useCallback((message: any) => new Promise<void>((resolve) => {
    console.log('useChat received SocketIO message:', message);
    
    var { type, data } = message;
    var currentHandlers = handlersRef.current;
    var messageData = message.data || message;
    var messageType = message.type || type;

    var eventMap: { [key: string]: () => Promise<void> | void } = {
      'new_message': () => currentHandlers.handleNewMessage?.(messageData),
      'new-message': () => currentHandlers.handleNewMessage?.(messageData),
      'message-read': () => currentHandlers.handleMessageRead?.(messageData),
      'conversation-read': () => currentHandlers.handleConversationRead?.(messageData),
      'mark-as-read-success': () => currentHandlers.handleMarkAsReadSuccess?.(messageData),
      'user-typing': () => currentHandlers.handleUserTyping?.({...messageData, isTyping: true}),
      'user-stopped-typing': () => currentHandlers.handleUserTyping?.({...messageData, isTyping: false}),
      'conversation-updated': () => currentHandlers.handleConversationUpdated?.(messageData),
      'user-online': () => currentHandlers.handleUserOnline?.(messageData),
      'new-conversation-assigned': () => currentHandlers.handleNewConversationAssigned?.(messageData),
      'conversation:removed': () => currentHandlers.handleConversationRemoved?.(messageData),
      'conversation:assigned': () => currentHandlers.handleConversationAssigned?.(messageData),
      'messages-read': () => currentHandlers.handleMessagesRead?.(messageData),
      'message-marked-as-read': () => currentHandlers.handleSingleMessageRead?.(messageData),
      'connected': () => console.log('Connected to chat:', messageData),
      'room-joined': () => console.log('Joined room:', messageData),
      'message-sent': () => console.log('Message sent confirmation:', messageData),
      'cached-messages': () => console.log('Received cached messages:', messageData),
      'error': () => {
        console.error('Chat error:', messageData);
        console.error('Full error details:', JSON.stringify(messageData, null, 2));
      }
    };

    var handler = eventMap[messageType];
    handler ? (() => {
      var result = handler();
      result instanceof Promise ? result.then(() => resolve()) : resolve();
    })() : (() => {
      console.log('Unknown SocketIO event:', messageType, messageData);
      resolve();
    })();
  }), []);

  var updateHandlers = (newHandlers: EventHandlers) => 
    new Promise<void>((resolve) => {
      handlersRef.current = { ...handlersRef.current, ...newHandlers };
      resolve();
    });

  return {
    handleSocketIOMessage,
    updateHandlers
  };
};