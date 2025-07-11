import { Test, TestingModule } from '@nestjs/testing';
import { PresenceService } from './presence.service';
import { RedisService } from './redis.service';
import { PresenceStatus } from '../interfaces/presence.interface';

describe('PresenceService', () => {
  let service: PresenceService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    setUserPresence: jest.fn(),
    getUserPresence: jest.fn(),
    getMultipleUserPresence: jest.fn(),
    getOnlineUsers: jest.fn(),
    getUserPresenceHistory: jest.fn(),
    setUserOffline: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresenceService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateUserPresence', () => {
    it('should update user presence with default values', async () => {
      const userId = 'test-user';
      const status = PresenceStatus.ONLINE;

      mockRedisService.setUserPresence.mockResolvedValue(undefined);

      const result = await service.updateUserPresence(userId, status);

      expect(result).toEqual({
        status,
        lastSeen: expect.any(Number),
        deviceType: 'unknown',
      });

      expect(redisService.setUserPresence).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          status,
          lastSeen: expect.any(Number),
          deviceType: 'unknown',
        }),
        expect.any(Number)
      );
    });

    it('should update user presence with custom options', async () => {
      const userId = 'test-user';
      const status = PresenceStatus.BUSY;
      const options = {
        deviceId: 'device-123',
        deviceType: 'mobile' as const,
        activity: 'In a meeting',
        location: 'Conference Room A',
      };

      mockRedisService.setUserPresence.mockResolvedValue(undefined);

      const result = await service.updateUserPresence(userId, status, options);

      expect(result).toEqual({
        status,
        lastSeen: expect.any(Number),
        deviceId: 'device-123',
        deviceType: 'mobile',
        activity: 'In a meeting',
        location: 'Conference Room A',
      });
    });
  });

  describe('setUserOnline', () => {
    it('should set user online and start heartbeat', async () => {
      const userId = 'test-user';
      const options = {
        deviceType: 'desktop' as const,
        activity: 'Active in chat',
      };

      mockRedisService.setUserPresence.mockResolvedValue(undefined);
      const startHeartbeatSpy = jest.spyOn(service, 'startHeartbeat');

      const result = await service.setUserOnline(userId, options);

      expect(result).toEqual({
        status: PresenceStatus.ONLINE,
        lastSeen: expect.any(Number),
        deviceType: 'desktop',
        activity: 'Active in chat',
      });

      expect(startHeartbeatSpy).toHaveBeenCalledWith(
        userId,
        expect.any(Function)
      );
    });
  });

  describe('setUserOffline', () => {
    it('should set user offline and stop heartbeat', async () => {
      const userId = 'test-user';

      mockRedisService.setUserOffline.mockResolvedValue(undefined);
      const stopHeartbeatSpy = jest.spyOn(service, 'stopHeartbeat');

      await service.setUserOffline(userId);

      expect(stopHeartbeatSpy).toHaveBeenCalledWith(userId);
      expect(redisService.setUserOffline).toHaveBeenCalledWith(userId);
    });
  });

  describe('isUserOnline', () => {
    it('should return true for online user', async () => {
      const userId = 'test-user';
      mockRedisService.getUserPresence.mockResolvedValue({
        status: PresenceStatus.ONLINE,
        lastSeen: Date.now(),
      });

      const result = await service.isUserOnline(userId);

      expect(result).toBe(true);
    });

    it('should return false for offline user', async () => {
      const userId = 'test-user';
      mockRedisService.getUserPresence.mockResolvedValue({
        status: PresenceStatus.OFFLINE,
        lastSeen: Date.now(),
      });

      const result = await service.isUserOnline(userId);

      expect(result).toBe(false);
    });

    it('should return false when user presence is null', async () => {
      const userId = 'test-user';
      mockRedisService.getUserPresence.mockResolvedValue(null);

      const result = await service.isUserOnline(userId);

      expect(result).toBe(false);
    });
  });

  describe('getPresenceStats', () => {
    it('should return presence statistics', async () => {
      const mockOnlineUsers = [
        { userId: 'user1', status: PresenceStatus.ONLINE, lastSeen: Date.now() },
        { userId: 'user2', status: PresenceStatus.AWAY, lastSeen: Date.now() },
        { userId: 'user3', status: PresenceStatus.BUSY, lastSeen: Date.now() },
      ];

      mockRedisService.getOnlineUsers.mockResolvedValue(mockOnlineUsers);

      const result = await service.getPresenceStats();

      expect(result).toEqual({
        online: 1,
        away: 1,
        busy: 1,
        offline: 0,
        total: 3,
      });
    });

    it('should handle empty user list', async () => {
      mockRedisService.getOnlineUsers.mockResolvedValue([]);

      const result = await service.getPresenceStats();

      expect(result).toEqual({
        online: 0,
        away: 0,
        busy: 0,
        offline: 0,
        total: 0,
      });
    });
  });

  describe('heartbeat management', () => {
    it('should start and stop heartbeat correctly', () => {
      const userId = 'test-user';

      // Start heartbeat
      service.startHeartbeat(userId);

      // Stop heartbeat
      service.stopHeartbeat(userId);

      // Should not throw
      expect(() => service.stopHeartbeat(userId)).not.toThrow();
    });
  });
});