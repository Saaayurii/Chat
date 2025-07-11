import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PresenceStatus, PresenceData, OnlineUser } from './types';
import { useCrossTabSync } from './useCrossTabSync';
import { usePresenceNotifications } from './usePresenceNotifications';

interface UsePresenceOptions {
  apiUrl: string;
  userId: string;
  token?: string;
  heartbeatInterval?: number;
  autoConnect?: boolean;
  enableCrossTabSync?: boolean;
  enableNotifications?: boolean;
  playNotificationSounds?: boolean;
  showBrowserNotifications?: boolean;
}

interface UsePresenceReturn {
  socket: Socket | null;
  isConnected: boolean;
  currentPresence: PresenceData | null;
  onlineUsers: OnlineUser[];
  isActiveTab: boolean;
  setStatus: (status: PresenceStatus, activity?: string) => void;
  requestPresence: (userIds?: string[]) => void;
  disconnect: () => void;
  connect: () => void;
}

export const usePresence = ({
  apiUrl,
  userId,
  token,
  heartbeatInterval = 30000,
  autoConnect = true,
  enableCrossTabSync = true,
  enableNotifications = false,
  playNotificationSounds = false,
  showBrowserNotifications = false
}: UsePresenceOptions): UsePresenceReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPresence, setCurrentPresence] = useState<PresenceData | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cross-tab synchronization
  const crossTabSync = useCrossTabSync({
    userId,
    onPresenceUpdate: (presence) => {
      setCurrentPresence(presence);
    },
    onTabActiveChange: (isActive, activeTabId) => {
      console.log(`Tab activity changed: ${isActive ? 'active' : 'inactive'}, active tab: ${activeTabId}`);
      
      // Если вкладка стала неактивной, останавливаем heartbeat
      if (!isActive) {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      }
      // Если вкладка стала активной, переподключаемся и запускаем heartbeat
      else if (isActive && socket && !heartbeatIntervalRef.current) {
        heartbeatIntervalRef.current = setInterval(() => {
          socket.emit('presence:heartbeat', {
            status: currentPresence?.status || PresenceStatus.ONLINE
          });
        }, heartbeatInterval);
      }
    }
  });

  // Notifications system
  const notifications = usePresenceNotifications({
    enabled: enableNotifications,
    playSound: playNotificationSounds,
    showBrowserNotifications,
    onUserOnline: (user) => {
      console.log('Notification: User came online', user);
    },
    onUserOffline: (userId) => {
      console.log('Notification: User went offline', userId);
    },
    onStatusChange: (userId, oldStatus, newStatus) => {
      console.log('Notification: Status changed', { userId, oldStatus, newStatus });
    }
  });

  const connect = useCallback(() => {
    if (socket?.connected) return;
    
    // Только активная вкладка устанавливает соединение
    if (enableCrossTabSync && !crossTabSync.isActiveTab) {
      console.log('Not connecting - this tab is not active');
      return;
    }

    const newSocket = io(`${apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Presence: Connected to server');
      setIsConnected(true);
      
      // Запускаем heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      heartbeatIntervalRef.current = setInterval(() => {
        newSocket.emit('presence:heartbeat', {
          status: currentPresence?.status || PresenceStatus.ONLINE
        });
      }, heartbeatInterval);

      // Запрашиваем текущее состояние присутствия
      newSocket.emit('presence:request', {});
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Presence: Disconnected from server:', reason);
      setIsConnected(false);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Пытаемся переподключиться через 5 секунд
      if (reason === 'io server disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          newSocket.connect();
        }, 5000);
      }
    });

    newSocket.on('connected', (data) => {
      console.log('Presence: User connected', data);
      if (data.presence) {
        setCurrentPresence(data.presence);
      }
    });

    newSocket.on('presence:update', (data) => {
      console.log('Presence: User presence updated', data);
      if (data.userId === userId) {
        setCurrentPresence(data.presence);
      }
      
      // Обновляем список онлайн пользователей
      setOnlineUsers(prev => 
        prev.map(user => 
          user.userId === data.userId 
            ? { ...user, ...data.presence }
            : user
        )
      );
    });

    newSocket.on('presence:user_online', (data) => {
      console.log('Presence: User came online', data);
      
      const newUser: OnlineUser = {
        userId: data.userId,
        lastSeen: data.presence.lastSeen,
        status: data.presence.status,
        deviceType: data.presence.deviceType,
        activity: data.presence.activity
      };
      
      setOnlineUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (exists) {
          return prev.map(user => 
            user.userId === data.userId 
              ? { ...user, ...data.presence }
              : user
          );
        }
        
        // Уведомляем о новом пользователе онлайн
        if (data.userId !== userId) {
          notifications.notifyUserOnline(newUser);
        }
        
        return [...prev, newUser];
      });
    });

    newSocket.on('presence:user_offline', (data) => {
      console.log('Presence: User went offline', data);
      
      // Уведомляем об offline пользователе
      if (data.userId !== userId) {
        notifications.notifyUserOffline(data.userId);
      }
      
      setOnlineUsers(prev => 
        prev.filter(user => user.userId !== data.userId)
      );
    });

    newSocket.on('presence:bulk_update', (data) => {
      console.log('Presence: Bulk update received', data);
      const users: OnlineUser[] = Object.entries(data).map(([userId, presence]) => ({
        userId,
        lastSeen: (presence as PresenceData).lastSeen,
        status: (presence as PresenceData).status,
        deviceType: (presence as PresenceData).deviceType,
        activity: (presence as PresenceData).activity
      })).filter(user => user.status !== PresenceStatus.OFFLINE);
      
      setOnlineUsers(users);
    });

    newSocket.on('error', (error) => {
      console.error('Presence: Socket error', error);
    });

    setSocket(newSocket);
  }, [apiUrl, token, userId, heartbeatInterval, currentPresence?.status]);

  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
  }, [socket]);

  const setStatus = useCallback((status: PresenceStatus, activity?: string) => {
    const newPresence = currentPresence ? { ...currentPresence, status, activity } : {
      status,
      lastSeen: Date.now(),
      activity
    };
    
    // Обновляем локальное состояние
    setCurrentPresence(newPresence);
    
    // Синхронизируем между вкладками
    if (enableCrossTabSync) {
      crossTabSync.sendPresenceUpdate(newPresence);
    }
    
    // Отправляем на сервер только если это активная вкладка
    if (socket?.connected && (!enableCrossTabSync || crossTabSync.isActiveTab)) {
      socket.emit('presence:set_status', { status, activity });
    }
  }, [socket, currentPresence, enableCrossTabSync, crossTabSync]);

  const requestPresence = useCallback((userIds?: string[]) => {
    if (!socket?.connected) return;

    socket.emit('presence:request', { userIds });
  }, [socket]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Обработка видимости страницы для автоматической смены статуса
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!socket?.connected) return;

      if (document.hidden) {
        // Страница скрыта - устанавливаем статус "away" через 5 минут
        setTimeout(() => {
          if (document.hidden && currentPresence?.status === PresenceStatus.ONLINE) {
            setStatus(PresenceStatus.AWAY, 'Неактивен');
          }
        }, 300000); // 5 минут
      } else {
        // Страница видна - возвращаем онлайн статус
        if (currentPresence?.status === PresenceStatus.AWAY) {
          setStatus(PresenceStatus.ONLINE);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket, currentPresence?.status, setStatus]);

  return {
    socket,
    isConnected,
    currentPresence,
    onlineUsers,
    isActiveTab: enableCrossTabSync ? crossTabSync.isActiveTab : true,
    setStatus,
    requestPresence,
    disconnect,
    connect
  };
};