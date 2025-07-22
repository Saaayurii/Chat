import { create } from 'zustand';
import type { Message, OperatorInfo, ConversationState, WidgetState } from '../types';

interface WidgetStore extends WidgetState, ConversationState {
  // Widget actions
  setIsOpen: (isOpen: boolean) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setIsCreatingConversation: (isCreating: boolean) => void;
  toggleWidget: () => void;
  minimizeWidget: () => void;
  
  // Modal actions
  setShowRatingModal: (show: boolean) => void;
  setShowComplaintModal: (show: boolean) => void;
  
  // Conversation actions
  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setIsTyping: (isTyping: boolean) => void;
  setOperatorInfo: (operatorInfo: OperatorInfo | null) => void;
  updateOperatorInfo: (updater: (prev: OperatorInfo | null) => OperatorInfo | null) => void;
  
  // Restore conversation ID from localStorage
  restoreConversationId: () => void;
  saveConversationId: (id: string) => void;
  clearConversationId: () => void;
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  // Initial state
  isOpen: false,
  isMinimized: false,
  isConnected: false,
  isCreatingConversation: false,
  showRatingModal: false,
  showComplaintModal: false,
  id: null,
  messages: [],
  isTyping: false,
  operatorInfo: null,

  // Widget actions
  setIsOpen: (isOpen) => set({ isOpen }),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsCreatingConversation: (isCreatingConversation) => set({ isCreatingConversation }),
  
  toggleWidget: () => {
    const { isMinimized, isOpen } = get();
    if (isMinimized) {
      set({ isMinimized: false });
    } else if (!isOpen) {
      set({ isOpen: true });
    }
  },
  
  minimizeWidget: () => set({ isMinimized: true }),

  // Modal actions
  setShowRatingModal: (showRatingModal) => set({ showRatingModal }),
  setShowComplaintModal: (showComplaintModal) => set({ showComplaintModal }),

  // Conversation actions
  setConversationId: (id) => set({ id }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setMessages: (messages) => set({ messages }),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),
  
  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== id)
  })),
  
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setOperatorInfo: (operatorInfo) => set({ operatorInfo }),
  updateOperatorInfo: (updater: (prev: OperatorInfo | null) => OperatorInfo | null) => set((state) => ({
    operatorInfo: updater(state.operatorInfo)
  })),

  // localStorage helpers
  restoreConversationId: () => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('chat_widget_conversation_id');
      if (savedId) {
        set({ id: savedId });
      }
    }
  },
  
  saveConversationId: (id) => {
    set({ id });
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_widget_conversation_id', id);
    }
  },
  
  clearConversationId: () => {
    set({ id: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chat_widget_conversation_id');
    }
  },
}));