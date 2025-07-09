import { User, Conversation, Message, Question, Complaint, Rating, BlacklistEntry, UserRole, ConversationStatus, MessageType, QuestionPriority, QuestionStatus, ComplaintStatus, BlacklistType, BlacklistReason } from '@/types';

// Mock data factories
export const mockUser = (overrides?: Partial<User>): User => ({
  _id: '1',
  id: '1',
  email: 'test@example.com',
  role: UserRole.VISITOR,
  isActivated: true,
  isBlocked: false,
  blacklistedByAdmin: false,
  blacklistedByOperator: false,
  profile: {
    username: 'testuser',
    fullName: 'Test User',
    lastSeenAt: new Date(),
    isOnline: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockConversation = (overrides?: Partial<Conversation>): Conversation => ({
  _id: '1',
  participants: ['1', '2'],
  type: 'user-operator' as any,
  status: ConversationStatus.ACTIVE,
  unreadMessagesCount: 0,
  unreadByParticipant: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockMessage = (overrides?: Partial<Message>): Message => ({
  _id: '1',
  conversationId: '1',
  senderId: '1',
  type: MessageType.TEXT,
  text: 'Test message',
  status: 'sent' as any,
  isEdited: false,
  readBy: [],
  readTimestamps: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockQuestion = (overrides?: Partial<Question>): Question => ({
  _id: '1',
  text: 'Test question?',
  category: 'general',
  priority: QuestionPriority.MEDIUM,
  status: QuestionStatus.OPEN,
  visitorId: '1',
  messagesCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockComplaint = (overrides?: Partial<Complaint>): Complaint => ({
  _id: '1',
  type: 'OTHER' as any,
  complaintText: 'Test complaint',
  severity: 'medium' as any,
  status: ComplaintStatus.PENDING,
  visitorId: '1',
  operatorId: '2',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockRating = (overrides?: Partial<Rating>): Rating => ({
  _id: '1',
  operatorId: '2',
  visitorId: '1',
  rating: 5,
  comment: 'Great service!',
  isAnonymous: false,
  isVisible: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockBlacklistEntry = (overrides?: Partial<BlacklistEntry>): BlacklistEntry => ({
  _id: '1',
  userId: '1',
  reason: BlacklistReason.SPAM,
  description: 'Test blacklist entry',
  type: BlacklistType.TEMPORARY,
  status: 'active' as any,
  blockedBy: '2',
  createdAt: new Date(),
  updatedAt: new Date(),
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