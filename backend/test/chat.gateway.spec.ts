import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket, io as ioc } from 'socket.io-client';
import { ChatGateway } from '../src/chat/chat.gateway';
import { ChatService } from '../src/chat/chat.service';
import { RedisService } from '../src/common/services/redis.service';

describe('ChatGateway', () => {
  let app: INestApplication;
  let chatGateway: ChatGateway;
  let clientSocket: Socket;
  let port: number;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: {
            canUserJoinConversation: jest.fn().mockResolvedValue(true),
            createMessage: jest.fn().mockResolvedValue({
              id: 'test-message-id',
              content: 'Test message',
              senderId: 'test-user-id',
              conversationId: 'test-conversation-id',
              timestamp: new Date(),
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setSocketSession: jest.fn(),
            setUserOnline: jest.fn(),
            setUserOffline: jest.fn(),
            deleteSocketSession: jest.fn(),
            addUserToChat: jest.fn(),
            removeUserFromChat: jest.fn(),
          },
        },
      ],
    }).compile();

    chatGateway = moduleRef.get<ChatGateway>(ChatGateway);
    
    app = moduleRef.createNestApplication();
    await app.init();

    // Получаем случайный порт
    port = Math.floor(Math.random() * 10000) + 3000;
    await app.listen(port);
  });

  afterEach(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await app.close();
  });

  it('should be defined', () => {
    expect(chatGateway).toBeDefined();
  });

  it('should handle connection with valid user', (done) => {
    clientSocket = ioc(`http://localhost:${port}/chat`, {
      transports: ['websocket'],
    });

    // Мокаем пользователя
    clientSocket.on('connect', () => {
      clientSocket.emit('authenticate', { token: 'valid-token' });
    });

    clientSocket.on('connected', (data) => {
      expect(data.message).toBe('Successfully connected to chat');
      done();
    });

    clientSocket.on('error', (error) => {
      done(error);
    });
  });

  it('should handle join-room event', (done) => {
    clientSocket = ioc(`http://localhost:${port}/chat`, {
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('join-room', {
        conversationId: 'test-conversation-id',
      });
    });

    clientSocket.on('room-joined', (data) => {
      expect(data.conversationId).toBe('test-conversation-id');
      done();
    });

    clientSocket.on('error', (error) => {
      done(error);
    });
  });

  it('should handle send-message event', (done) => {
    clientSocket = ioc(`http://localhost:${port}/chat`, {
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('send-message', {
        conversationId: 'test-conversation-id',
        content: 'Hello, world!',
      });
    });

    clientSocket.on('new-message', (data) => {
      expect(data.content).toBe('Test message');
      expect(data.senderId).toBe('test-user-id');
      done();
    });

    clientSocket.on('error', (error) => {
      done(error);
    });
  });

  it('should handle typing events', (done) => {
    clientSocket = ioc(`http://localhost:${port}/chat`, {
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('typing-start', {
        conversationId: 'test-conversation-id',
      });
    });

    clientSocket.on('user-typing', (data) => {
      expect(data.userId).toBeDefined();
      done();
    });

    clientSocket.on('error', (error) => {
      done(error);
    });
  });
});