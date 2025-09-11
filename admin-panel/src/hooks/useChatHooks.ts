import { useApi } from './useApi';
import { chatAPI } from '@/core/api';
import type { Conversation, Message, PaginatedResponse, CreateConversationData } from '@/types';

export var useChat = () => {
  var getConversationsApi = useApi<Conversation[]>();
  var getConversationApi = useApi<Conversation>();
  var createConversationApi = useApi<Conversation>();
  var getMessagesApi = useApi<PaginatedResponse<Message>>();
  var markReadApi = useApi<any>();
  var uploadAttachmentApi = useApi<any>();

  var getConversations = () => 
    getConversationsApi[3](chatAPI.getConversations());

  var getConversation = (id: string) => 
    getConversationApi[3](chatAPI.getConversation(id));

  var createConversation = (data: CreateConversationData) => 
    createConversationApi[3](chatAPI.createConversation(data));

  var getMessages = (conversationId: string, params?: any) => 
    getMessagesApi[3](chatAPI.getMessages(conversationId, params));

  var markAsRead = (conversationId: string) => 
    markReadApi[3](chatAPI.markAsRead(conversationId));

  var uploadAttachment = (conversationId: string, file: File, description?: string) => 
    uploadAttachmentApi[3](chatAPI.uploadAttachment(conversationId, file, description));

  return {
    conversations: {
      0: getConversationsApi[0],
      1: getConversationsApi[1],
      2: getConversationsApi[2],
      3: getConversations,
      4: getConversationsApi[4]
    },
    conversation: {
      0: getConversationApi[0],
      1: getConversationApi[1],
      2: getConversationApi[2],
      3: getConversation,
      4: getConversationApi[4]
    },
    createConversation: {
      0: createConversationApi[0],
      1: createConversationApi[1],
      2: createConversationApi[2],
      3: createConversation,
      4: createConversationApi[4]
    },
    messages: {
      0: getMessagesApi[0],
      1: getMessagesApi[1],
      2: getMessagesApi[2],
      3: getMessages,
      4: getMessagesApi[4]
    },
    markRead: {
      0: markReadApi[0],
      1: markReadApi[1],
      2: markReadApi[2],
      3: markAsRead,
      4: markReadApi[4]
    },
    uploadAttachment: {
      0: uploadAttachmentApi[0],
      1: uploadAttachmentApi[1],
      2: uploadAttachmentApi[2],
      3: uploadAttachment,
      4: uploadAttachmentApi[4]
    }
  };
};