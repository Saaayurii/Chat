export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline'
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface PresenceData {
  status: PresenceStatus;
  lastSeen: number;
  deviceId?: string;
  deviceType?: DeviceType;
  activity?: string;
  location?: string;
  updatedAt?: number;
}

export interface OnlineUser {
  userId: string;
  lastSeen: number;
  status: PresenceStatus;
  deviceType?: DeviceType;
  activity?: string;
}

export interface PresenceHistory {
  status: PresenceStatus;
  timestamp: number;
  deviceType?: DeviceType;
  duration?: number;
}

export interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export interface PresenceAvatarProps {
  userId: string;
  userName: string;
  avatar?: string;
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export interface OnlineUsersListProps {
  users: OnlineUser[];
  maxVisible?: number;
  onUserClick?: (userId: string) => void;
  className?: string;
}

export interface PresenceStatusSelectorProps {
  currentStatus: PresenceStatus;
  onStatusChange: (status: PresenceStatus) => void;
  disabled?: boolean;
  className?: string;
}

export const PRESENCE_COLORS = {
  [PresenceStatus.ONLINE]: '#10b981', // green-500
  [PresenceStatus.AWAY]: '#f59e0b', // amber-500
  [PresenceStatus.BUSY]: '#ef4444', // red-500
  [PresenceStatus.INVISIBLE]: '#6b7280', // gray-500
  [PresenceStatus.OFFLINE]: '#9ca3af', // gray-400
};

export const PRESENCE_LABELS = {
  [PresenceStatus.ONLINE]: 'В сети',
  [PresenceStatus.AWAY]: 'Отошел',
  [PresenceStatus.BUSY]: 'Занят',
  [PresenceStatus.INVISIBLE]: 'Невидимый',
  [PresenceStatus.OFFLINE]: 'Не в сети',
};