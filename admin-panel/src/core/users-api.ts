import { api } from './config';
import type { 
  User, 
  CreateUserData, 
  CreateOperatorData, 
  UpdateUserData, 
  UpdateProfileData,
  PaginatedResponse, 
  StatisticsData, 
  PaginationParams, 
  UserRole 
} from '@/types';

export var usersAPI = {
  getUsers: (params?: PaginationParams & { role?: keyof typeof UserRole; search?: string }) =>
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

export var profileAPI = {
  updateProfile: (data: UpdateProfileData) =>
    api.put('/profile', data),

  uploadAvatar: (file: File) => {
    var formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};