import { api } from './config';
import type { 
  Conversation, 
  Message, 
  CreateConversationData, 
  SendMessageData, 
  GetMessagesParams,
  PaginatedResponse,
  UserRole 
} from '@/types';

export var chatAPI = {
  getConversations: () =>
    api.get<Conversation[]>('/chat/conversations'),

  getConversation: (id: string) =>
    api.get<Conversation>(`/chat/conversations/${id}`),

  createConversation: (data: CreateConversationData) =>
    api.post<Conversation>('/chat/conversations', data),

  getMessages: (conversationId: string, params?: GetMessagesParams) =>
    api.get<PaginatedResponse<Message>>(`/chat/conversations/${conversationId}/messages`, { params }),

  markAsRead: (conversationId: string) =>
    api.put(`/chat/conversations/${conversationId}/read`),

  uploadAttachment: (conversationId: string, file: File, description?: string) => {
    var formData = new FormData();
    formData.append('file', file);
    description ? formData.append('description', description) : null;
    return api.post(`/chat/conversations/${conversationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getOperators: () =>
    api.get<{
      id: string;
      email: string;
      profile: {
        username: string;
        fullName: string;
        avatarUrl?: string;
        isOnline: boolean;
        status?: 'free' | 'busy' | 'break' | 'offline';
      };
      role: keyof typeof UserRole;
      activeChats: number;
      lastActivity: string;
    }[]>('/users/operators'),

  transferChat: (conversationId: string, operatorId: string) =>
    api.post(`/transfer/request`, { chatId: conversationId, toOperatorId: operatorId }),

  getPendingTransferRequests: () =>
    api.get<{
      id: string;
      fromOperator: {
        id: string;
        name: string;
        avatar?: string;
      };
      visitor: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
      };
      conversationId: string;
      reason?: string;
      timestamp: string;
    }[]>('/transfer/pending'),

  respondToTransfer: (transferId: string, accepted: boolean) =>
    api.put(`/transfer/respond`, { transferId, accepted }),

  blockUser: (userId: string, data: { reason: string; comment: string; conversationId: string }) =>
    api.post('/blacklist', { userId, reason: data.reason, comment: data.comment, conversationId: data.conversationId }),
    
  requestUserBlock: (userId: string, data: { reason: string; comment: string; conversationId: string }) =>
    api.post('/blacklist/request', { 
      userId: userId, 
      reason: data.reason, 
      description: data.comment,
      type: 'temporary',
      severity: 1
    }),
};