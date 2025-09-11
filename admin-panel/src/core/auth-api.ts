import { api } from './config';
import type { 
  LoginData, 
  LoginResponse, 
  RegistrationData, 
  ConfirmEmailData, 
  ForgotPasswordData, 
  ResetPasswordData,
  User 
} from '@/types';

export var authAPI = {
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