import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import type { Message, User, OperatorInfo } from './types';

class ChatWidgetCore {
  private apiClient: AxiosInstance;
  private socket: Socket | null = null;
  private wsUrl: string;

  constructor(apiUrl: string) {
    this.wsUrl = apiUrl; // WebSocket использует тот же базовый URL
    
    this.apiClient = axios.create({
      baseURL: apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor для добавления токена
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token && token !== 'anonymous') {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor для обработки ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('ChatWidget: Unauthorized, clearing auth');
          this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('chat_widget_token') || 
           localStorage.getItem('access_token');
  }

  private getStoredSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('chat_widget_user') || 
                    localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.sessionId || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chat_widget_token');
      localStorage.removeItem('chat_widget_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    }
  }

  // =============================================================================
  // AUTH API METHODS
  // =============================================================================

  async validateToken(token: string): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await this.apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false };
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await this.apiClient.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ token: string; user: User }> {
    const response = await this.apiClient.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('ChatWidget: Logout request failed:', error);
    }
  }

  // =============================================================================
  // CONVERSATION API METHODS
  // =============================================================================

  async createAnonymousConversation(data: {
    visitorName: string;
    visitorEmail?: string;
    title: string;
    sessionId: string;
    initialMessage: string;
    userId?: string;
    userRole?: string;
  }): Promise<{ id: string; assignedOperator?: any }> {
    const response = await this.apiClient.post('/public/chat/conversations', data);
    return response.data;
  }

  async getConversation(conversationId: string): Promise<any> {
    const response = await this.apiClient.get(`/public/chat/conversations/${conversationId}`);
    return response.data;
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const response = await this.apiClient.get(
      `/public/chat/conversations/${conversationId}/messages`,
      { params: { limit } }
    );
    return response.data.messages || response.data;
  }

  async sendAnonymousMessage(conversationId: string, data: {
    text: string;
    type?: string;
    sessionId?: string;
    senderName?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiClient.post(
        `/public/chat/conversations/${conversationId}/messages`,
        data
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async sendAuthorizedMessage(conversationId: string, data: {
    text: string;
    type?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiClient.post(
        `/chat/conversations/${conversationId}/messages`,
        data
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async markMessagesAsRead(conversationId: string, sessionId?: string): Promise<void> {
    try {
      const token = this.getStoredToken();
      if (token && token !== 'anonymous') {
        // Для авторизованных пользователей
        await this.apiClient.put(`/chat/conversations/${conversationId}/read`);
      } else {
        // Для анонимных пользователей
        await this.apiClient.put(
          `/public/chat/conversations/${conversationId}/read`,
          { sessionId }
        );
      }
    } catch (error) {
      console.warn('ChatWidget: Failed to mark messages as read:', error);
    }
  }

  // =============================================================================
  // OPERATOR API METHODS
  // =============================================================================

  async getOnlineOperators(): Promise<OperatorInfo[]> {
    try {
      const response = await this.apiClient.get('/public/users/operators', {
        params: { online: true, limit: 1 }
      });
      return response.data.operators || [];
    } catch (error) {
      console.warn('ChatWidget: Failed to get online operators:', error);
      return [];
    }
  }

  async getOperators(): Promise<OperatorInfo[]> {
    try {
      const response = await this.apiClient.get('/public/users/operators', {
        params: { limit: 1 }
      });
      return response.data.operators || [];
    } catch (error) {
      console.warn('ChatWidget: Failed to get operators:', error);
      return [];
    }
  }

  // =============================================================================
  // RATING AND COMPLAINT API METHODS
  // =============================================================================

  async createRating(data: {
    operatorId: string;
    rating: number;
    comment?: string;
    conversationId?: string;
  }): Promise<void> {
    await this.apiClient.post('/ratings', data);
  }

  async createComplaint(data: {
    operatorId: string;
    reason: string;
    details: string;
    conversationId?: string;
  }): Promise<void> {
    await this.apiClient.post('/complaints', data);
  }

  // =============================================================================
  // FILE UPLOAD API METHODS
  // =============================================================================

  async uploadFile(conversationId: string, file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.apiClient.post(
        `/chat/conversations/${conversationId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // =============================================================================
  // WEBSOCKET METHODS
  // =============================================================================

  connectWebSocket(namespace: string = '/chat', options: {
    onMessage?: (message: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
  } = {}): void {
    if (this.socket?.connected) {
      console.log('ChatWidget: WebSocket already connected');
      return;
    }

    const token = this.getStoredToken();
    const sessionId = this.getStoredSessionId();
    
    console.log(`ChatWidget: Connecting WebSocket to ${this.wsUrl}${namespace}`);

    const connectionOptions: any = {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    };

    // Настройка аутентификации
    if (token && token !== 'anonymous') {
      connectionOptions.auth = { token };
      connectionOptions.query = { token };
      connectionOptions.extraHeaders = {
        Authorization: `Bearer ${token}`
      };
    } else if (sessionId) {
      connectionOptions.auth = { sessionId };
      connectionOptions.query = { sessionId };
    }

    this.socket = io(`${this.wsUrl}${namespace}`, connectionOptions);

    // Обработчики событий
    this.socket.on('connect', () => {
      console.log(`ChatWidget: WebSocket connected to ${namespace}`);
      options.onConnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error(`ChatWidget: WebSocket connection error to ${namespace}:`, error);
      options.onError?.(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`ChatWidget: WebSocket disconnected from ${namespace}: ${reason}`);
      options.onDisconnect?.();
    });

    // Обработчик для всех входящих сообщений
    this.socket.onAny((eventName, ...args) => {
      const message = {
        type: eventName,
        data: args[0],
        timestamp: new Date()
      };
      options.onMessage?.(message);
    });
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      console.log('ChatWidget: Disconnecting WebSocket');
      this.socket.offAny();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitWebSocket(event: string, data?: any): boolean {
    if (!this.socket?.connected) {
      console.warn('ChatWidget: WebSocket not connected, cannot emit event:', event);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error('ChatWidget: Failed to emit WebSocket event', event, error);
      return false;
    }
  }

  isWebSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('chat_widget_user') || 
                    localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || user._id || user.sessionId || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!(token && token !== 'anonymous');
  }

  updateApiUrl(newApiUrl: string): void {
    this.wsUrl = newApiUrl;
    this.apiClient.defaults.baseURL = newApiUrl;
  }
}

// Экспортируем singleton инстанс
export const chatCore = new ChatWidgetCore(
  import.meta.env.VITE_API_URL || 'http://localhost:3004'
);

export default chatCore;