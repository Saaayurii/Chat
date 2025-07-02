import axios from 'axios';
import { 
  User, 
  Conversation, 
  Message, 
  PaginatedResponse, 
  StatisticsData,
  PaginationParams,
  UserRole,
  // Email types
  SendEmailData,
  SendTemplateEmailData,
  // Questions types
  Question,
  CreateQuestionData,
  AssignOperatorData,
  TransferQuestionData,
  CloseQuestionData,
  UpdateQuestionData,
  QuestionStats,
  QuestionStatus,
  QuestionPriority,
  // Complaints types
  Complaint,
  CreateComplaintData,
  ReviewComplaintData,
  UpdateComplaintData,
  ComplaintStats,
  ComplaintStatus,
  ComplaintType,
  ComplaintSeverity,
  // Blacklist types
  BlacklistEntry,
  CreateBlacklistEntryData,
  ApproveBlacklistEntryData,
  RevokeBlacklistEntryData,
  UpdateBlacklistEntryData,
  BlacklistStats,
  BlacklistStatus,
  BlacklistReason,
  BlacklistType,
  // Ratings types
  Rating,
  CreateRatingData,
  UpdateRatingVisibilityData,
  HideRatingData,
  OperatorRatingStats,
  RatingStats
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

// Email API
export const emailAPI = {
  sendEmail: (data: SendEmailData) =>
    api.post('/email/send', data),

  sendTemplateEmail: (data: SendTemplateEmailData) =>
    api.post('/email/send-template', data),

  sendWelcomeEmail: (email: string, username: string) =>
    api.post('/email/welcome', { email, username }),

  sendPasswordResetEmail: (email: string, resetUrl: string) =>
    api.post('/email/password-reset', { email, resetUrl }),

  sendEmailVerification: (email: string, verificationUrl: string) =>
    api.post('/email/email-verification', { email, verificationUrl }),

  sendOperatorAssignedEmail: (email: string, operatorName: string, questionText: string) =>
    api.post('/email/operator-assigned', { email, operatorName, questionText }),

  sendQuestionAnsweredEmail: (email: string, questionText: string, answer: string) =>
    api.post('/email/question-answered', { email, questionText, answer }),

  sendComplaintReceivedEmail: (email: string, complaintId: string) =>
    api.post('/email/complaint-received', { email, complaintId }),

  sendBlacklistNotificationEmail: (email: string, reason: string, duration?: string) =>
    api.post('/email/blacklist-notification', { email, reason, duration }),

  sendRatingRequestEmail: (email: string, operatorName: string, ratingUrl: string) =>
    api.post('/email/rating-request', { email, operatorName, ratingUrl }),
};

// Questions API
export const questionsAPI = {
  createQuestion: (data: CreateQuestionData) =>
    api.post<Question>('/questions', data),

  getQuestions: (params?: PaginationParams & {
    status?: QuestionStatus;
    priority?: QuestionPriority;
    category?: string;
    operatorId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ questions: Question[]; total: number }>('/questions', { params }),

  getMyQuestions: () =>
    api.get<Question[]>('/questions/my'),

  getQuestionById: (id: string) =>
    api.get<Question>(`/questions/${id}`),

  assignOperator: (id: string, data: AssignOperatorData) =>
    api.put<Question>(`/questions/${id}/assign`, data),

  transferQuestion: (id: string, data: TransferQuestionData) =>
    api.put<Question>(`/questions/${id}/transfer`, data),

  closeQuestion: (id: string, data: CloseQuestionData) =>
    api.put<Question>(`/questions/${id}/close`, data),

  markFirstResponse: (id: string) =>
    api.put(`/questions/${id}/first-response`),

  incrementMessagesCount: (id: string) =>
    api.put(`/questions/${id}/increment-messages`),

  updateQuestion: (id: string, data: UpdateQuestionData) =>
    api.put<Question>(`/questions/${id}`, data),

  deleteQuestion: (id: string) =>
    api.delete(`/questions/${id}`),

  getOperatorWorkload: (operatorId: string) =>
    api.get<{ activeQuestions: number; totalQuestions: number; closedToday: number }>(`/questions/operator/${operatorId}/workload`),

  getQuestionStats: () =>
    api.get<QuestionStats>('/questions/stats'),
};

// Complaints API
export const complaintsAPI = {
  createComplaint: (data: CreateComplaintData) =>
    api.post<Complaint>('/complaints', data),

  getComplaints: (params?: PaginationParams & {
    status?: ComplaintStatus;
    type?: ComplaintType;
    severity?: ComplaintSeverity;
    operatorId?: string;
    visitorId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ complaints: Complaint[]; total: number }>('/complaints', { params }),

  getMyComplaints: () =>
    api.get<Complaint[]>('/complaints/my'),

  getComplaintById: (id: string) =>
    api.get<Complaint>(`/complaints/${id}`),

  getComplaintsByOperator: (operatorId: string) =>
    api.get<Complaint[]>(`/complaints/operator/${operatorId}`),

  getOperatorComplaintHistory: (operatorId: string) =>
    api.get<{
      complaints: Complaint[];
      totalComplaints: number;
      resolvedComplaints: number;
      warningsCount: number;
      suspensionsCount: number;
    }>(`/complaints/operator/${operatorId}/history`),

  reviewComplaint: (id: string, data: ReviewComplaintData) =>
    api.put<Complaint>(`/complaints/${id}/review`, data),

  updateComplaint: (id: string, data: UpdateComplaintData) =>
    api.put<Complaint>(`/complaints/${id}`, data),

  deleteComplaint: (id: string) =>
    api.delete(`/complaints/${id}`),

  getComplaintStats: () =>
    api.get<ComplaintStats>('/complaints/stats'),
};

// Blacklist API
export const blacklistAPI = {
  createBlacklistEntry: (data: CreateBlacklistEntryData) =>
    api.post<BlacklistEntry>('/blacklist', data),

  getBlacklistEntries: (params?: PaginationParams & {
    status?: BlacklistStatus;
    reason?: BlacklistReason;
    type?: BlacklistType;
    userId?: string;
    blockedBy?: string;
    approvedByAdmin?: boolean;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ entries: BlacklistEntry[]; total: number }>('/blacklist', { params }),

  getBlacklistEntryById: (id: string) =>
    api.get<BlacklistEntry>(`/blacklist/${id}`),

  getBlacklistEntriesByUser: (userId: string) =>
    api.get<BlacklistEntry[]>(`/blacklist/user/${userId}`),

  checkUserBlacklist: (userId: string) =>
    api.get<{ isBlacklisted: boolean }>(`/blacklist/check/${userId}`),

  approveBlacklistEntry: (id: string, data: ApproveBlacklistEntryData) =>
    api.put<BlacklistEntry>(`/blacklist/${id}/approve`, data),

  revokeBlacklistEntry: (id: string, data: RevokeBlacklistEntryData) =>
    api.put<BlacklistEntry>(`/blacklist/${id}/revoke`, data),

  updateBlacklistEntry: (id: string, data: UpdateBlacklistEntryData) =>
    api.put<BlacklistEntry>(`/blacklist/${id}`, data),

  deleteBlacklistEntry: (id: string) =>
    api.delete(`/blacklist/${id}`),

  processExpiredEntries: () =>
    api.post('/blacklist/process-expired'),

  getBlacklistStats: () =>
    api.get<BlacklistStats>('/blacklist/stats'),
};

// Ratings API
export const ratingsAPI = {
  createRating: (data: CreateRatingData) =>
    api.post<Rating>('/ratings', data),

  getRatings: (params?: PaginationParams & {
    operatorId?: string;
    visitorId?: string;
    minRating?: number;
    maxRating?: number;
    isVisible?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get<{ ratings: Rating[]; total: number }>('/ratings', { params }),

  getMyRatings: () =>
    api.get<Rating[]>('/ratings/my'),

  getRatingById: (id: string) =>
    api.get<Rating>(`/ratings/${id}`),

  getOperatorRatings: (operatorId: string, params?: PaginationParams & {
    includeHidden?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    api.get<OperatorRatingStats>(`/ratings/operator/${operatorId}`, { params }),

  getOperatorStats: (operatorId: string) =>
    api.get<{
      averageRating: number;
      totalRatings: number;
      ratingBreakdown: Record<string, number>;
      detailedAverages: {
        avgProfessionalism: number;
        avgResponseTime: number;
        avgHelpfulness: number;
        avgCommunication: number;
        avgProblemResolution: number;
      };
    }>(`/ratings/operator/${operatorId}/stats`),

  hideRating: (id: string, data: HideRatingData) =>
    api.put<Rating>(`/ratings/${id}/hide`, data),

  updateRatingVisibility: (id: string, data: UpdateRatingVisibilityData) =>
    api.put<Rating>(`/ratings/${id}/visibility`, data),

  deleteRating: (id: string) =>
    api.delete(`/ratings/${id}`),

  getRatingStats: () =>
    api.get<RatingStats>('/ratings/stats'),
};

export default api;