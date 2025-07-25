'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIState {
  isMobileMenuOpen: boolean;
  isUserInfoOpen: boolean;
  isChatSidebarOpen: boolean;
  selectedChatId: string | null;
}

interface UIContextType {
  state: UIState;
  actions: {
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleUserInfo: () => void;
    closeUserInfo: () => void;
    toggleChatSidebar: () => void;
    closeChatSidebar: () => void;
    setSelectedChat: (chatId: string | null) => void;
    closeAllPanels: () => void;
  };
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, setState] = useState<UIState>({
    isMobileMenuOpen: false,
    isUserInfoOpen: false,
    isChatSidebarOpen: true,
    selectedChatId: null,
  });

  const actions = {
    toggleMobileMenu: () => {
      setState(prev => ({
        ...prev,
        isMobileMenuOpen: !prev.isMobileMenuOpen,
        // Закрываем другие панели при открытии мобильного меню
        isUserInfoOpen: prev.isMobileMenuOpen ? prev.isUserInfoOpen : false,
      }));
    },
    
    closeMobileMenu: () => {
      setState(prev => ({ ...prev, isMobileMenuOpen: false }));
    },
    
    toggleUserInfo: () => {
      setState(prev => ({
        ...prev,
        isUserInfoOpen: !prev.isUserInfoOpen,
        // Закрываем мобильное меню при открытии пользовательской панели
        isMobileMenuOpen: prev.isUserInfoOpen ? prev.isMobileMenuOpen : false,
      }));
    },
    
    closeUserInfo: () => {
      setState(prev => ({ ...prev, isUserInfoOpen: false }));
    },
    
    toggleChatSidebar: () => {
      setState(prev => ({ ...prev, isChatSidebarOpen: !prev.isChatSidebarOpen }));
    },
    
    closeChatSidebar: () => {
      setState(prev => ({ ...prev, isChatSidebarOpen: false }));
    },
    
    setSelectedChat: (chatId: string | null) => {
      setState(prev => ({ ...prev, selectedChatId: chatId }));
    },
    
    closeAllPanels: () => {
      setState(prev => ({
        ...prev,
        isMobileMenuOpen: false,
        isUserInfoOpen: false,
      }));
    },
  };

  return (
    <UIContext.Provider value={{ state, actions }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}