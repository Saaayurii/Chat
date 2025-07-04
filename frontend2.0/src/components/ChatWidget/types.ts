export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'operator';
  senderName?: string;
  attachments?: string[];
  type?: 'text' | 'file' | 'system';
}

export interface ChatWidgetProps {
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
  onClose?: () => void;
  onMinimize?: () => void;
}

export interface EmbeddableWidgetProps {
  config?: {
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
  };
}

export interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  operatorName?: string;
}

export interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  operatorName?: string;
}

export interface OperatorInfo {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  role: string;
}