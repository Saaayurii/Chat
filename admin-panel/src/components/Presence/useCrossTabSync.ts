import { useEffect, useRef, useCallback } from 'react';
import { PresenceData, PresenceStatus } from './types';

interface CrossTabMessage {
  type: 'PRESENCE_UPDATE' | 'PRESENCE_REQUEST' | 'PRESENCE_RESPONSE' | 'TAB_ACTIVE' | 'TAB_INACTIVE';
  payload: any;
  timestamp: number;
  tabId: string;
}

interface UseCrossTabSyncOptions {
  userId: string;
  onPresenceUpdate?: (presence: PresenceData) => void;
  onTabActiveChange?: (isActive: boolean, activeTabId: string) => void;
}

interface UseCrossTabSyncReturn {
  isActiveTab: boolean;
  sendPresenceUpdate: (presence: PresenceData) => void;
  requestPresenceSync: () => void;
  tabId: string;
}

export const useCrossTabSync = ({
  userId,
  onPresenceUpdate,
  onTabActiveChange
}: UseCrossTabSyncOptions): UseCrossTabSyncReturn => {
  const tabId = useRef(`tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isActiveTabRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const STORAGE_KEY = `presence_sync_${userId}`;
  const ACTIVE_TAB_KEY = `active_tab_${userId}`;
  const HEARTBEAT_INTERVAL = 5000; // 5 секунд
  const TAB_TIMEOUT = 10000; // 10 секунд до считания вкладки неактивной

  // Отправка сообщения в другие вкладки
  const sendMessage = useCallback((message: Omit<CrossTabMessage, 'timestamp' | 'tabId'>) => {
    const fullMessage: CrossTabMessage = {
      ...message,
      timestamp: Date.now(),
      tabId: tabId.current
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullMessage));
    // Удаляем сообщение сразу после отправки чтобы trigger storage event
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  // Обновление активной вкладки
  const updateActiveTab = useCallback(() => {
    const activeTabInfo = {
      tabId: tabId.current,
      timestamp: Date.now(),
      userId
    };
    
    localStorage.setItem(ACTIVE_TAB_KEY, JSON.stringify(activeTabInfo));
    
    if (!isActiveTabRef.current) {
      isActiveTabRef.current = true;
      sendMessage({ type: 'TAB_ACTIVE', payload: { tabId: tabId.current } });
      onTabActiveChange?.(true, tabId.current);
    }
  }, [ACTIVE_TAB_KEY, userId, sendMessage, onTabActiveChange]);

  // Проверка активности вкладок
  const checkTabActivity = useCallback(() => {
    const activeTabData = localStorage.getItem(ACTIVE_TAB_KEY);
    if (activeTabData) {
      try {
        const { tabId: activeTabId, timestamp } = JSON.parse(activeTabData);
        const timeSinceUpdate = Date.now() - timestamp;
        
        // Если активная вкладка не обновлялась больше TAB_TIMEOUT или это наша вкладка
        if (timeSinceUpdate > TAB_TIMEOUT || activeTabId === tabId.current) {
          updateActiveTab();
        } else if (isActiveTabRef.current && activeTabId !== tabId.current) {
          // Эта вкладка больше не активна
          isActiveTabRef.current = false;
          sendMessage({ type: 'TAB_INACTIVE', payload: { tabId: tabId.current } });
          onTabActiveChange?.(false, activeTabId);
        }
      } catch (error) {
        console.error('Error parsing active tab data:', error);
        updateActiveTab();
      }
    } else {
      updateActiveTab();
    }
  }, [ACTIVE_TAB_KEY, updateActiveTab, onTabActiveChange]);

  // Отправка обновления присутствия
  const sendPresenceUpdate = useCallback((presence: PresenceData) => {
    sendMessage({
      type: 'PRESENCE_UPDATE',
      payload: { presence, userId }
    });
  }, [sendMessage, userId]);

  // Запрос синхронизации присутствия
  const requestPresenceSync = useCallback(() => {
    sendMessage({
      type: 'PRESENCE_REQUEST',
      payload: { userId, requesterId: tabId.current }
    });
  }, [sendMessage, userId]);

  // Обработка сообщений от других вкладок
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;

    try {
      const message: CrossTabMessage = JSON.parse(event.newValue);
      
      // Игнорируем собственные сообщения
      if (message.tabId === tabId.current) return;

      switch (message.type) {
        case 'PRESENCE_UPDATE':
          if (message.payload.userId === userId) {
            onPresenceUpdate?.(message.payload.presence);
          }
          break;

        case 'PRESENCE_REQUEST':
          if (message.payload.userId === userId && isActiveTabRef.current) {
            // Активная вкладка должна ответить с текущим состоянием присутствия
            // Это будет обработано в компоненте, который использует этот хук
          }
          break;

        case 'TAB_ACTIVE':
          if (message.payload.tabId !== tabId.current && isActiveTabRef.current) {
            isActiveTabRef.current = false;
            onTabActiveChange?.(false, message.payload.tabId);
          }
          break;

        case 'TAB_INACTIVE':
          // Можно использовать для логирования или статистики
          break;
      }
    } catch (error) {
      console.error('Error parsing cross-tab message:', error);
    }
  }, [STORAGE_KEY, userId, onPresenceUpdate, onTabActiveChange]);

  // Обработка фокуса/размытия окна
  const handleVisibilityChange = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (document.hidden) {
      // Окно скрыто - останавливаем heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    } else {
      // Окно видимо - возобновляем heartbeat и проверяем активность
      checkTabActivity();
      
      if (!heartbeatIntervalRef.current) {
        heartbeatIntervalRef.current = setInterval(checkTabActivity, HEARTBEAT_INTERVAL);
      }
    }
  }, [checkTabActivity]);

  // Обработка активности пользователя
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (!document.hidden) {
      updateActiveTab();
    }
  }, [updateActiveTab]);

  useEffect(() => {
    // Регистрируем вкладку как активную при старте
    updateActiveTab();
    
    // Запускаем heartbeat
    heartbeatIntervalRef.current = setInterval(checkTabActivity, HEARTBEAT_INTERVAL);
    
    // Слушаем изменения localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Слушаем изменения видимости
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Слушаем активность пользователя
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Обработка закрытия вкладки
    const handleBeforeUnload = () => {
      localStorage.removeItem(ACTIVE_TAB_KEY);
      sendMessage({ type: 'TAB_INACTIVE', payload: { tabId: tabId.current } });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Очистка
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      // Удаляем информацию об активной вкладке если это была наша вкладка
      const activeTabData = localStorage.getItem(ACTIVE_TAB_KEY);
      if (activeTabData) {
        try {
          const { tabId: activeTabId } = JSON.parse(activeTabData);
          if (activeTabId === tabId.current) {
            localStorage.removeItem(ACTIVE_TAB_KEY);
          }
        } catch (error) {
          // Игнорируем ошибки при очистке
        }
      }
    };
  }, [
    updateActiveTab,
    checkTabActivity,
    handleStorageChange,
    handleVisibilityChange,
    handleUserActivity,
    ACTIVE_TAB_KEY,
    sendMessage
  ]);

  return {
    isActiveTab: isActiveTabRef.current,
    sendPresenceUpdate,
    requestPresenceSync,
    tabId: tabId.current
  };
};