import { QueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@/types';

interface HandlersConfig {
  queryClient: QueryClient;
  userId?: string;
}

export var useChatHandlers = ({ queryClient, userId }: HandlersConfig) => {
  
  var handleNewMessage = (messageData: any) => new Promise<void>((resolve) => {
    console.log('handleNewMessage called with:', messageData);
    
    var message = {
      _id: messageData.id || messageData._id,
      id: messageData.id || messageData._id,
      text: messageData.text || messageData.content,
      content: messageData.text || messageData.content,
      senderId: messageData.senderId,
      conversationId: messageData.conversationId,
      createdAt: messageData.timestamp || messageData.createdAt,
      timestamp: messageData.timestamp || messageData.createdAt,
      type: messageData.type || 'text',
      status: messageData.status || 'sent',
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      readBy: messageData.readBy || [],
      isRead: messageData.isRead || false,
      readTimestamps: messageData.readTimestamps || {}
    };
    
    var conversationId = message.conversationId;
    
    !conversationId ? (() => {
      console.warn('No conversationId in message:', messageData);
      resolve();
    })() : (() => {
      queryClient.setQueryData(
        ['messages', conversationId],
        (oldData: any) => !oldData ? 
          { data: [message], total: 1 } : 
          { ...oldData, data: [...oldData.data, message] }
      );

      queryClient.setQueryData(
        ['conversations'],
        (oldData: any) => !Array.isArray(oldData) ? oldData :
          oldData.map((conv: any) => 
            conv._id === conversationId || conv.id === conversationId ? {
              ...conv,
              lastMessage: {
                text: message.text,
                senderId: message.senderId,
                timestamp: message.createdAt,
                messageId: message._id
              },
              unreadMessagesCount: message.senderId !== userId ? 
                (conv.unreadMessagesCount || 0) + 1 : 
                (conv.unreadMessagesCount || 0)
            } : conv
          )
      );
      
      resolve();
    })();
  });

  var handleMessageRead = (data: { messageId: string; conversationId: string; userId: string }) => 
    new Promise<void>((resolve) => {
      var { messageId, conversationId, userId: readUserId } = data;
      
      queryClient.setQueryData(
        ['messages', conversationId],
        (oldData: any) => !oldData ? oldData : {
          ...oldData,
          data: oldData.data.map((message: Message) => 
            message._id === messageId ? {
              ...message,
              readBy: [...new Set([...message.readBy, readUserId])],
              isRead: true,
              readTimestamps: {
                ...message.readTimestamps,
                [readUserId]: new Date()
              }
            } : message
          )
        }
      );
      
      queryClient.setQueryData(
        ['conversations'],
        (oldData: any) => !Array.isArray(oldData) ? oldData :
          oldData.map((conv: any) => 
            conv._id === conversationId || conv.id === conversationId ? {
              ...conv,
              unreadMessagesCount: Math.max(0, (conv.unreadMessagesCount || 0) - 1)
            } : conv
          )
      );
      
      resolve();
    });

  var handleConversationRead = (data: { conversationId: string; readBy: string; readAt: string }) => 
    new Promise<void>((resolve) => {
      var { conversationId, readBy } = data;
      
      queryClient.setQueryData(
        ['messages', conversationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          var messages = oldData.data && Array.isArray(oldData.data) ? oldData.data :
                        oldData.messages && Array.isArray(oldData.messages) ? oldData.messages :
                        Array.isArray(oldData) ? oldData : [];
          
          var updatedMessages = messages.map((message: any) => 
            message.senderId !== readBy ? {
              ...message,
              readBy: [...new Set([...(message.readBy || []), readBy])],
              isRead: true,
              readTimestamps: {
                ...message.readTimestamps,
                [readBy]: data.readAt
              }
            } : message
          );
          
          return oldData.data ? { ...oldData, data: updatedMessages } :
                 oldData.messages ? { ...oldData, messages: updatedMessages } :
                 updatedMessages;
        }
      );
      
      queryClient.setQueryData(
        ['conversations'],
        (oldData: any) => !Array.isArray(oldData) ? oldData :
          oldData.map((conv: any) => 
            conv._id === conversationId || conv.id === conversationId ? {
              ...conv,
              unreadMessagesCount: readBy === userId ? 0 : conv.unreadMessagesCount
            } : conv
          )
      );
      
      resolve();
    });

  var handleConversationUpdated = (conversation: Conversation) => 
    new Promise<void>((resolve) => {
      queryClient.setQueryData(
        ['conversations'],
        (oldData: Conversation[]) => {
          if (!oldData) return oldData;
          var index = oldData.findIndex(conv => conv._id === conversation._id);
          return index !== -1 ? (() => {
            var newData = [...oldData];
            newData[index] = conversation;
            return newData;
          })() : [conversation, ...oldData];
        }
      );
      resolve();
    });

  var handleNewConversationAssigned = (data: any) => 
    new Promise<void>((resolve) => {
      console.log('Новая беседа назначена оператору:', data);
      
      var { conversation, assignedOperatorId, userName, userEmail, userType } = data;
      
      assignedOperatorId === userId ? (() => {
        queryClient.setQueryData(
          ['conversations'],
          (oldData: Conversation[]) => {
            if (!oldData) return [conversation];
            
            var exists = oldData.find(conv => 
              conv._id === conversation._id || (conv as any).id === (conversation as any).id
            );
            
            return !exists ? (() => {
              console.log(`Добавлена новая беседа от ${userName} (${userType})`);
              return [conversation, ...oldData];
            })() : oldData;
          }
        );
        
        typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ?
          new Notification(`Новая беседа от ${userName}`, {
            body: `Пользователь ${userName} ${userEmail ? `(${userEmail})` : ''} начал беседу`,
            icon: '/chat-icon.png',
            tag: `conversation-${conversation._id}`
          }) : null;
      })() : null;
      
      resolve();
    });

  return {
    handleNewMessage,
    handleMessageRead,
    handleConversationRead,
    handleConversationUpdated,
    handleNewConversationAssigned
  };
};