import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (token: string, user: User) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Также сохраняем токен в cookies для middleware
          const isSecure = window.location.protocol === 'https:';
          document.cookie = `access_token=${token}; path=/; max-age=86400; ${isSecure ? 'secure;' : ''} samesite=lax`;
        }
        set({ token, user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          
          // Также удаляем токен из cookies
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      },
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      initializeAuth: () => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          const userStr = localStorage.getItem('user');
          
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              // Обновляем cookie при инициализации
              const isSecure = window.location.protocol === 'https:';
              document.cookie = `access_token=${token}; path=/; max-age=86400; ${isSecure ? 'secure;' : ''} samesite=lax`;
              set({ token, user, isAuthenticated: true, isLoading: false });
            } catch (error) {
              console.error('Error parsing user data:', error);
              // Если не удается распарсить данные, очищаем все
              localStorage.removeItem('access_token');
              localStorage.removeItem('user');
              document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);