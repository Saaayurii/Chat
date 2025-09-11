import { User } from './user';
import { UserRole } from './common';

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