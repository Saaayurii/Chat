export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'operator';
  senderName?: string;
  attachments?: string[];
  type?: 'text' | 'file' | 'system';
  isRead?: boolean;
  readBy?: string[];
}

export interface ChatWidgetConfig {
  apiUrl?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  allowFileUpload?: boolean;
  allowComplaint?: boolean;
  allowRating?: boolean;
  maxFileSize?: number;
  placeholder?: string;
  welcomeMessage?: string;
  operatorName?: string;
  operatorAvatar?: string;
  autoLoad?: boolean;
  minimizeOnStart?: boolean;
}

export interface OperatorInfo {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  email?: string;
  profile?: {
    fullName?: string;
    username?: string;
    avatarUrl?: string;
  };
}

export interface User {
  id?: string;
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  role?: string;
  isAnonymous?: boolean;
  sessionId?: string;
  profile?: {
    fullName?: string;
    username?: string;
    avatarUrl?: string;
  };
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  sessionId: string | null;
}

export interface SocketIOMessage {
  type: string;
  data: any;
  timestamp?: Date;
}

export interface ConversationState {
  id: string | null;
  messages: Message[];
  isTyping: boolean;
  operatorInfo: OperatorInfo | null;
}

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isConnected: boolean;
  isCreatingConversation: boolean;
  showRatingModal: boolean;
  showComplaintModal: boolean;
}