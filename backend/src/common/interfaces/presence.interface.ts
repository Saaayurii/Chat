export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown'
}

export type DeviceTypeString = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface PresenceData {
  status: PresenceStatus;
  lastSeen: number;
  deviceId?: string;
  deviceType?: DeviceTypeString;
  activity?: string;
  location?: string;
  updatedAt?: number;
  ttl?: number;
}

export interface PresenceHistory {
  status: PresenceStatus;
  timestamp: number;
  deviceType?: DeviceTypeString;
  duration?: number; // Время в этом статусе в миллисекундах
}

export interface OnlineUser {
  userId: string;
  lastSeen: number;
  status: PresenceStatus;
  deviceType?: DeviceTypeString;
  activity?: string;
}

export interface PresenceUpdate {
  userId: string;
  presence: PresenceData;
  previousStatus?: PresenceStatus;
}

// События Socket.IO для присутствия
export interface PresenceEvents {
  'presence:update': PresenceUpdate;
  'presence:bulk_update': { [userId: string]: PresenceData };
  'presence:user_online': { userId: string; presence: PresenceData };
  'presence:user_offline': { userId: string; lastSeen: number };
  'presence:request': { userIds: string[] };
  'presence:heartbeat': { status: PresenceStatus; activity?: string };
}

// Настройки присутствия
export interface PresenceConfig {
  heartbeatInterval: number; // Интервал heartbeat в миллисекундах
  offlineTimeout: number; // Таймаут для оффлайн статуса
  awayTimeout: number; // Таймаут для away статуса
  historyLimit: number; // Лимит записей в истории
  batchUpdateSize: number; // Размер пакета для групповых обновлений
}

export const DEFAULT_PRESENCE_CONFIG: PresenceConfig = {
  heartbeatInterval: 30000, // 30 секунд
  offlineTimeout: 300000, // 5 минут
  awayTimeout: 600000, // 10 минут
  historyLimit: 100,
  batchUpdateSize: 50
};