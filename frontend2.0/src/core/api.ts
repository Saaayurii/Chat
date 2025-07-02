import axios from 'axios';
import { 
  User, 
  Conversation, 
  Message, 
  PaginatedResponse, 
  StatisticsData,
  PaginationParams,
  UserRole 
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Types
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegistrationData {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface ConfirmEmailData {
  token: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// Users Types
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface CreateOperatorData {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  role?: UserRole;
}

export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
}

// Chat Types
export interface CreateConversationData {
  participantIds: string[];
  type: string;
}

export interface SendMessageData {
  text: string;
  type?: string;
}

export interface GetMessagesParams extends PaginationParams {
  limit?: number;
  skip?: number;
}

// Auth API
export const authAPI = {
  login: (data: LoginData) => 
    api.post<LoginResponse>('/auth/login', data),
  
  register: (data: RegistrationData) => 
    api.post('/auth/register', data),

  confirmEmail: (data: ConfirmEmailData) =>
    api.post('/auth/confirm-email', data),

  forgotPassword: (data: ForgotPasswordData) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordData) =>
    api.post('/auth/reset-password', data),
  
  logout: () => 
    api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),

  getProfile: () =>
    api.get<{ user: User }>('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: (params?: PaginationParams & { role?: UserRole; search?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getOperators: (online?: boolean) =>
    api.get<User[]>('/users/operators', { params: { online } }),

  getUserById: (id: string) =>
    api.get<User>(`/users/${id}`),

  createUser: (data: CreateUserData) =>
    api.post<User>('/users', data),

  createOperator: (data: CreateOperatorData) =>
    api.post<User>('/users/operators', data),

  updateUser: (id: string, data: UpdateUserData) =>
    api.put<User>(`/users/${id}`, data),

  toggleUserBlock: (id: string) =>
    api.put(`/users/${id}/block`),

  activateUser: (id: string) =>
    api.put(`/users/${id}/activate`),

  deleteUser: (id: string, reason: string) =>
    api.delete(`/users/${id}`, { data: { reason } }),

  getUsersStats: () =>
    api.get<StatisticsData>('/users/stats'),
};

// Profile API
export const profileAPI = {
  updateProfile: (data: UpdateProfileData) =>
    api.put('/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Chat API
export const chatAPI = {
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
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return api.post(`/chat/conversations/${conversationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default api;