import { useEffect, useRef } from 'react';
import { PresenceData, PresenceStatus, OnlineUser } from './types';

interface UsePresenceNotificationsOptions {
  enabled?: boolean;
  playSound?: boolean;
  showBrowserNotifications?: boolean;
  onUserOnline?: (user: OnlineUser) => void;
  onUserOffline?: (userId: string) => void;
  onStatusChange?: (userId: string, oldStatus: PresenceStatus, newStatus: PresenceStatus) => void;
}

interface UsePresenceNotificationsReturn {
  notifyUserOnline: (user: OnlineUser) => void;
  notifyUserOffline: (userId: string, userName?: string) => void;
  notifyStatusChange: (userId: string, userName: string, oldStatus: PresenceStatus, newStatus: PresenceStatus) => void;
}

export const usePresenceNotifications = ({
  enabled = true,
  playSound = false,
  showBrowserNotifications = false,
  onUserOnline,
  onUserOffline,
  onStatusChange
}: UsePresenceNotificationsOptions): UsePresenceNotificationsReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationPermission = useRef<NotificationPermission>('default');

  useEffect(() => {
    // Запрашиваем разрешение на уведомления
    if (showBrowserNotifications && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        notificationPermission.current = permission;
      });
    }

    // Создаем аудио элемент для звуков
    if (playSound) {
      audioRef.current = new Audio();
      // Можно добавить звуковые файлы для разных событий
      // audioRef.current.src = '/sounds/notification.mp3';
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [showBrowserNotifications, playSound]);

  const playNotificationSound = () => {
    if (playSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  };

  const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if (
      showBrowserNotifications && 
      'Notification' in window && 
      notificationPermission.current === 'granted'
    ) {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'presence-notification'
      });
    }
  };

  const getStatusText = (status: PresenceStatus): string => {
    switch (status) {
      case PresenceStatus.ONLINE:
        return 'В сети';
      case PresenceStatus.AWAY:
        return 'Отошел';
      case PresenceStatus.BUSY:
        return 'Занят';
      case PresenceStatus.INVISIBLE:
        return 'Невидимый';
      case PresenceStatus.OFFLINE:
        return 'Не в сети';
      default:
        return 'Неизвестно';
    }
  };

  const notifyUserOnline = (user: OnlineUser) => {
    if (!enabled) return;

    console.log(`User ${user.userId} came online`);

    // Вызываем пользовательский callback
    onUserOnline?.(user);

    // Показываем браузерное уведомление
    showBrowserNotification(
      'Пользователь в сети',
      `${user.userId} подключился к чату`,
      user.deviceType ? `/icons/${user.deviceType}.png` : undefined
    );

    // Проигрываем звук
    playNotificationSound();
  };

  const notifyUserOffline = (userId: string, userName?: string) => {
    if (!enabled) return;

    console.log(`User ${userId} went offline`);

    // Вызываем пользовательский callback
    onUserOffline?.(userId);

    // Показываем браузерное уведомление
    showBrowserNotification(
      'Пользователь отключился',
      `${userName || userId} покинул чат`
    );
  };

  const notifyStatusChange = (
    userId: string, 
    userName: string, 
    oldStatus: PresenceStatus, 
    newStatus: PresenceStatus
  ) => {
    if (!enabled) return;

    console.log(`User ${userId} status changed from ${oldStatus} to ${newStatus}`);

    // Вызываем пользовательский callback
    onStatusChange?.(userId, oldStatus, newStatus);

    // Показываем браузерное уведомление только для значимых изменений
    if (
      (oldStatus === PresenceStatus.OFFLINE && newStatus === PresenceStatus.ONLINE) ||
      (oldStatus === PresenceStatus.ONLINE && newStatus === PresenceStatus.OFFLINE)
    ) {
      showBrowserNotification(
        'Изменение статуса',
        `${userName} теперь ${getStatusText(newStatus).toLowerCase()}`
      );
    }

    // Проигрываем звук для важных изменений
    if (newStatus === PresenceStatus.ONLINE || newStatus === PresenceStatus.OFFLINE) {
      playNotificationSound();
    }
  };

  return {
    notifyUserOnline,
    notifyUserOffline,
    notifyStatusChange
  };
};