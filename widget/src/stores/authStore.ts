import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '../types';

interface AuthStore extends AuthState {
  setAuth: (token: string, user: User) => void;
  setAnonymous: (sessionId: string, user?: User) => void;
  logout: () => void;
  initializeAuth: () => void;
}

const generateSessionId = (): string => {
  // Генерируем UUID v4 формат для совместимости с бэкендом
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback генерация UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const createAnonymousUser = (sessionId: string): User => {
  const anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id: anonymousId,
    _id: anonymousId,
    email: `anonymous@widget.temp`,
    firstName: 'Посетитель',
    lastName: 'Сайта',
    role: 'VISITOR',
    isAnonymous: true,
    sessionId
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      sessionId: null,

      setAuth: (token: string, user: User) => {
        console.log('AuthStore: setAuth called with user:', user?.id || 'none');
        
        // Сохраняем в localStorage для совместимости с основным приложением
        if (typeof window !== 'undefined') {
          localStorage.setItem('chat_widget_token', token);
          localStorage.setItem('chat_widget_user', JSON.stringify(user));
          
          // Сохраняем также в основные ключи для совместимости
          localStorage.setItem('access_token', token);
          localStorage.setItem('user_data', JSON.stringify(user));
          
          // Устанавливаем cookie для middleware
          const isSecure = window.location.protocol === 'https:';
          document.cookie = `chat_widget_token=${token}; path=/; max-age=86400; ${isSecure ? 'secure;' : ''} samesite=lax`;
        }
        
        const newState = { 
          token, 
          user, 
          isAuthenticated: user.role !== 'VISITOR' && !user.isAnonymous,
          sessionId: user.sessionId || null
        };
        
        set(newState);
        
        // Сохраняем состояние для доступа из core.ts
        if (typeof window !== 'undefined') {
          (window as any).__authStore = newState;
        }
      },

      setAnonymous: (sessionId: string, user?: User) => {
        console.log('AuthStore: setAnonymous called with sessionId:', sessionId);
        
        const anonymousUser = user || createAnonymousUser(sessionId);
        
        const newState = {
          token: 'anonymous',
          user: anonymousUser,
          isAuthenticated: false,
          sessionId
        };
        
        set(newState);
        
        // Сохраняем состояние для доступа из core.ts
        if (typeof window !== 'undefined') {
          (window as any).__authStore = newState;
        }
      },

      logout: () => {
        console.log('AuthStore: logout called');
        
        if (typeof window !== 'undefined') {
          // Очищаем все токены
          localStorage.removeItem('chat_widget_token');
          localStorage.removeItem('chat_widget_user');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('chat_widget_conversation_id');
          localStorage.removeItem('chat_widget_session_id');
          
          // Очищаем cookies
          document.cookie = 'chat_widget_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false, 
          sessionId: null 
        });
      },

      initializeAuth: () => {
        console.log('AuthStore: initializeAuth called');
        
        if (typeof window === 'undefined') return;

        // Проверяем токены основного приложения
        const appToken = localStorage.getItem('access_token');
        const appUserData = localStorage.getItem('user_data');
        
        // Проверяем токены виджета
        const widgetToken = localStorage.getItem('chat_widget_token');
        const widgetUserData = localStorage.getItem('chat_widget_user');
        
        const token = appToken || widgetToken;
        let userData = null;

        console.log('AuthStore: Found tokens - app:', !!appToken, 'widget:', !!widgetToken);

        if (appUserData) {
          try {
            userData = JSON.parse(appUserData);
            console.log('AuthStore: Using app user data:', userData?.id);
          } catch (e) {
            console.error('AuthStore: Error parsing app user data:', e);
          }
        } else if (widgetUserData) {
          try {
            userData = JSON.parse(widgetUserData);
            console.log('AuthStore: Using widget user data:', userData?.id);
          } catch (e) {
            console.error('AuthStore: Error parsing widget user data:', e);
          }
        }

        if (token && userData && token !== 'anonymous') {
          // Валидируем токен с сервером
          const validateToken = async () => {
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                const data = await response.json();
                console.log('AuthStore: Token valid, setting auth');
                get().setAuth(token, data.user);
                return;
              } else {
                console.log('AuthStore: Token invalid, creating anonymous session');
              }
            } catch (error) {
              console.log('AuthStore: Token validation failed, creating anonymous session');
            }

            // Если валидация не прошла, создаем или используем существующую анонимную сессию
            const existingSessionId = localStorage.getItem('chat_widget_session_id');
            if (existingSessionId) {
              get().setAnonymous(existingSessionId);
            } else {
              const sessionId = generateSessionId();
              localStorage.setItem('chat_widget_session_id', sessionId);
              get().setAnonymous(sessionId);
            }
          };

          validateToken();
        } else {
          // Проверяем существующий sessionId в localStorage
          const existingSessionId = localStorage.getItem('chat_widget_session_id');
          if (existingSessionId) {
            console.log('AuthStore: Using existing sessionId:', existingSessionId);
            get().setAnonymous(existingSessionId);
          } else {
            // Создаем анонимную сессию только если нет существующей
            console.log('AuthStore: No valid auth data, creating anonymous session');
            const sessionId = generateSessionId();
            localStorage.setItem('chat_widget_session_id', sessionId);
            get().setAnonymous(sessionId);
          }
        }
      },
    }),
    {
      name: 'chat-widget-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionId: state.sessionId,
      }),
    }
  )
);