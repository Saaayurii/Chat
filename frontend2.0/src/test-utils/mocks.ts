import { User, Conversation, Message, Question, Complaint, Rating, BlacklistEntry } from '@/types';

// Mock data factories
export const mockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockConversation = (overrides?: Partial<Conversation>): Conversation => ({
  id: '1',
  userId: '1',
  operatorId: '2',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [],
  ...overrides,
});

export const mockMessage = (overrides?: Partial<Message>): Message => ({
  id: '1',
  conversationId: '1',
  senderId: '1',
  content: 'Test message',
  type: 'text',
  timestamp: new Date(),
  ...overrides,
});

export const mockQuestion = (overrides?: Partial<Question>): Question => ({
  id: '1',
  content: 'Test question?',
  category: 'general',
  priority: 'medium',
  status: 'open',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockComplaint = (overrides?: Partial<Complaint>): Complaint => ({
  id: '1',
  userId: '1',
  content: 'Test complaint',
  category: 'service',
  priority: 'medium',
  status: 'open',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockRating = (overrides?: Partial<Rating>): Rating => ({
  id: '1',
  userId: '1',
  conversationId: '1',
  rating: 5,
  comment: 'Great service!',
  createdAt: new Date(),
  ...overrides,
});

export const mockBlacklistEntry = (overrides?: Partial<BlacklistEntry>): BlacklistEntry => ({
  id: '1',
  identifier: 'test@example.com',
  type: 'email',
  reason: 'spam',
  createdAt: new Date(),
  isActive: true,
  ...overrides,
});

// Mock API responses
export const mockApiResponse = <T>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error',
});

// Mock Socket.IO
export const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

// Mock next/navigation
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

// Mock window.location
export const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  replace: jest.fn(),
  assign: jest.fn(),
};