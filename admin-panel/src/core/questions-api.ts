import { api } from './config';
import type { 
  Question, 
  CreateQuestionData, 
  AssignOperatorData, 
  TransferQuestionData, 
  CloseQuestionData, 
  UpdateQuestionData, 
  QuestionStats,
  PaginationParams,
  QuestionStatus,
  QuestionPriority 
} from '@/types';

export var questionsAPI = {
  createQuestion: (data: CreateQuestionData) =>
    api.post<Question>('/questions', data),

  getQuestions: (params?: PaginationParams & {
    status?: keyof typeof QuestionStatus;
    priority?: keyof typeof QuestionPriority;
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