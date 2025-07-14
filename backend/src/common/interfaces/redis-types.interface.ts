// Типы для Redis операций и результатов

export interface RedisZSetMember {
  value: string;
  score: number;
}

export interface RedisMultiResult {
  [index: number]: any;
}

export interface RedisSubscriberOptions {
  onMessage?: (message: string, channel: string) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onReady?: () => void;
}

export interface RateLimitData {
  count: number;
  firstRequest: number;
  resetTime: number;
  windowMs: number;
}

export interface CachedMessageData {
  _id: string;
  content: string;
  senderId: string;
  conversationId: string;
  timestamp: number;
  type: string;
  cachedAt: number;
  isRead?: boolean;
  attachments?: any[];
}

export interface QueueTask {
  id: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  retriedAt?: number;
}

export interface UserPresenceCache {
  status: string;
  lastSeen: number;
  deviceType?: string;
  activity?: string;
  updatedAt: number;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  metadata?: any;
}

export interface TempFileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  uploaderUserId: string;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  date: string;
  hour?: number;
}

export interface NotificationPayload {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetUsers?: string[];
  metadata?: any;
}

// Типы для совместимости с разными версиями Redis клиента
export type RedisValue = string | number | Buffer;
export type RedisKey = string | Buffer;

export interface RedisClientCompatible {
  get(key: RedisKey): Promise<string | null>;
  set(key: RedisKey, value: RedisValue): Promise<string>;
  setEx(key: RedisKey, seconds: number, value: RedisValue): Promise<string>;
  del(...keys: RedisKey[]): Promise<number>;
  exists(...keys: RedisKey[]): Promise<number>;
  ttl(key: RedisKey): Promise<number>;
  expire(key: RedisKey, seconds: number): Promise<number>;
  
  // List operations
  lPush(key: RedisKey, ...elements: RedisValue[]): Promise<number>;
  rPush(key: RedisKey, ...elements: RedisValue[]): Promise<number>;
  lPop(key: RedisKey): Promise<string | null>;
  rPop(key: RedisKey): Promise<string | null>;
  lRange(key: RedisKey, start: number, stop: number): Promise<string[]>;
  lLen(key: RedisKey): Promise<number>;
  lTrim(key: RedisKey, start: number, stop: number): Promise<string>;
  lIndex(key: RedisKey, index: number): Promise<string | null>;
  
  // Set operations
  sAdd(key: RedisKey, ...members: RedisValue[]): Promise<number>;
  sRem(key: RedisKey, ...members: RedisValue[]): Promise<number>;
  sMembers(key: RedisKey): Promise<string[]>;
  sCard(key: RedisKey): Promise<number>;
  sIsMember(key: RedisKey, member: RedisValue): Promise<number>;
  
  // Sorted Set operations
  zAdd(key: RedisKey, ...scoreMembers: any[]): Promise<number>;
  zRem(key: RedisKey, ...members: RedisValue[]): Promise<number>;
  zRange(key: RedisKey, start: number, stop: number): Promise<string[]>;
  zRevRange(key: RedisKey, start: number, stop: number, options?: any): Promise<any>;
  zCard(key: RedisKey): Promise<number>;
  zScore(key: RedisKey, member: RedisValue): Promise<string | null>;
  zPopMax?(key: RedisKey): Promise<any>;
  zRemRangeByScore(key: RedisKey, min: string | number, max: string | number): Promise<number>;
  
  // Hash operations
  hSet(key: RedisKey, field: string, value: RedisValue): Promise<number>;
  hGet(key: RedisKey, field: string): Promise<string | null>;
  hGetAll(key: RedisKey): Promise<Record<string, string>>;
  hDel(key: RedisKey, ...fields: string[]): Promise<number>;
  hExists(key: RedisKey, field: string): Promise<number>;
  
  // Transaction operations
  multi(): any;
  
  // Pub/Sub operations
  publish(channel: string, message: RedisValue): Promise<number>;
  subscribe(channel: string, listener?: Function): Promise<any>;
  unsubscribe(...channels: string[]): Promise<any>;
  
  // Connection
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  quit(): Promise<string>;
  ping(): Promise<string>;
  duplicate(): any;
  
  // Status
  isOpen?: boolean;
  isReady?: boolean;
  status?: string;
  
  // Utility
  keys(pattern: string): Promise<string[]>;
  flushDb?(): Promise<string>;
  info?(section?: string): Promise<string>;
}

// Утилитарные типы для работы с Redis результатами
export type SafeParseResult<T> = T | null;

export function safeParseRedisResult<T>(value: any, defaultValue: T): T {
  try {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  } catch (error) {
    return defaultValue;
  }
}

export function ensureStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v));
  }
  return [];
}

export function ensureNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function ensureString(value: any, defaultValue: string = ''): string {
  return value ? String(value) : defaultValue;
}