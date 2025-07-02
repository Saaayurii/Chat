import { UserResponse } from '../../users/interfaces/user-response.interface';

export interface AuthResponse {
  user: UserResponse;
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  user: UserResponse;
  access_token: string;
  message: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}