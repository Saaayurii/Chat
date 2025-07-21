'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UnreadMessagesContextType {
  totalUnreadCount: number;
  updateUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;
  resetUnreadCount: () => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const useUnreadMessages = (): UnreadMessagesContextType => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};

interface UnreadMessagesProviderProps {
  children: ReactNode;
}

export const UnreadMessagesProvider: React.FC<UnreadMessagesProviderProps> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);

  const updateUnreadCount = useCallback((count: number) => {
    setTotalUnreadCount(Math.max(0, count));
  }, []);

  const incrementUnreadCount = useCallback(() => {
    setTotalUnreadCount(prev => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setTotalUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setTotalUnreadCount(0);
  }, []);

  const value: UnreadMessagesContextType = {
    totalUnreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};