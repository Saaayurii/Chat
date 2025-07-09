import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { BlacklistEntry, BlacklistEntryDocument, BlacklistStatus, BlacklistType, BlacklistReason } from '../database/schemas/blacklist-entry.schema';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { CreateBlacklistEntryDto } from './dto/create-blacklist-entry.dto';
import { UpdateBlacklistEntryDto, ApproveBlacklistEntryDto, RevokeBlacklistEntryDto } from './dto/update-blacklist-entry.dto';
import { QueryBlacklistDto } from './dto/query-blacklist.dto';

describe('BlacklistService', () => {
  let service: BlacklistService;
  let blacklistModel: Model<BlacklistEntryDocument>;
  let emailService: EmailService;
  let usersService: UsersService;

  const mockBlacklistModel = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    populate: jest.fn(),
  })) as any;

  mockBlacklistModel.findOne = jest.fn();
  mockBlacklistModel.find = jest.fn();
  mockBlacklistModel.findById = jest.fn();
  mockBlacklistModel.findByIdAndUpdate = jest.fn();
  mockBlacklistModel.findByIdAndDelete = jest.fn();
  mockBlacklistModel.countDocuments = jest.fn();
  mockBlacklistModel.aggregate = jest.fn();

  const mockEmailService = {
    sendBlacklistNotificationEmail: jest.fn(),
  };

  const mockUsersService = {
    updateUserBlockStatus: jest.fn(),
    findById: jest.fn(),
  };

  const mockBlacklistEntry = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    blockedBy: new Types.ObjectId(),
    reason: BlacklistReason.SPAM,
    description: 'Spamming in chat',
    type: BlacklistType.TEMPORARY,
    status: BlacklistStatus.ACTIVE,
    severity: 1,
    createdAt: new Date(),
    approvedByAdmin: false,
    relatedComplaints: [],
    relatedMessages: [],
    autoExpired: false,
    userNotified: false,
    updatedAt: new Date(),
    save: jest.fn(),
    populate: jest.fn(),
  } as any;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'user@example.com',
    profile: {
      username: 'testuser',
      fullName: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlacklistService,
        {
          provide: getModelToken(BlacklistEntry.name),
          useValue: mockBlacklistModel,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<BlacklistService>(BlacklistService);
    blacklistModel = module.get<Model<BlacklistEntryDocument>>(getModelToken(BlacklistEntry.name));
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBlacklistEntry', () => {
    const createDto: CreateBlacklistEntryDto = {
      userId: new Types.ObjectId().toString(),
      reason: BlacklistReason.SPAM,
      description: 'Spamming in chat',
      type: BlacklistType.TEMPORARY,
      severity: 1,
    };
    const blockedById = new Types.ObjectId().toString();

    it('should create a new blacklist entry successfully', async () => {
      mockBlacklistModel.findOne.mockResolvedValue(null);
      
      const saveableMock = {
        ...mockBlacklistEntry,
        save: jest.fn().mockResolvedValue({
          ...mockBlacklistEntry,
          populate: jest.fn().mockResolvedValue(mockBlacklistEntry),
        }),
      };

      mockBlacklistModel.mockReturnValue(saveableMock);
      mockBlacklistModel.findByIdAndUpdate.mockResolvedValue(mockBlacklistEntry);
      
      mockUsersService.updateUserBlockStatus.mockResolvedValue(undefined);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailService.sendBlacklistNotificationEmail.mockResolvedValue(undefined);

      const result = await service.createBlacklistEntry(createDto, blockedById);

      expect(mockBlacklistModel.findOne).toHaveBeenCalledWith({
        userId: new Types.ObjectId(createDto.userId),
        status: BlacklistStatus.ACTIVE,
      });
      expect(mockUsersService.updateUserBlockStatus).toHaveBeenCalledWith(createDto.userId, true);
      expect(mockEmailService.sendBlacklistNotificationEmail).toHaveBeenCalled();
      expect(result).toEqual(mockBlacklistEntry);
    });

    it('should throw ForbiddenException when user is already blacklisted', async () => {
      mockBlacklistModel.findOne.mockResolvedValue(mockBlacklistEntry);

      await expect(service.createBlacklistEntry(createDto, blockedById)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should create permanent blacklist entry', async () => {
      const permanentDto = { ...createDto, type: BlacklistType.PERMANENT };
      mockBlacklistModel.findOne.mockResolvedValue(null);
      
      const saveableMock = {
        ...mockBlacklistEntry,
        save: jest.fn().mockResolvedValue({
          ...mockBlacklistEntry,
          populate: jest.fn().mockResolvedValue(mockBlacklistEntry),
        }),
      };

      mockBlacklistModel.mockReturnValue(saveableMock);
      mockBlacklistModel.findByIdAndUpdate.mockResolvedValue(mockBlacklistEntry);
      
      mockUsersService.updateUserBlockStatus.mockResolvedValue(undefined);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailService.sendBlacklistNotificationEmail.mockResolvedValue(undefined);

      const result = await service.createBlacklistEntry(permanentDto, blockedById);

      expect(result).toEqual(mockBlacklistEntry);
    });

    it('should handle email notification failure gracefully', async () => {
      mockBlacklistModel.findOne.mockResolvedValue(null);
      
      const saveableMock = {
        ...mockBlacklistEntry,
        save: jest.fn().mockResolvedValue({
          ...mockBlacklistEntry,
          populate: jest.fn().mockResolvedValue(mockBlacklistEntry),
        }),
      };

      mockBlacklistModel.mockReturnValue(saveableMock);
      mockBlacklistModel.findByIdAndUpdate.mockResolvedValue(mockBlacklistEntry);
      
      mockUsersService.updateUserBlockStatus.mockResolvedValue(undefined);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailService.sendBlacklistNotificationEmail.mockRejectedValue(new Error('Email failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.createBlacklistEntry(createDto, blockedById);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send blacklist notification:', expect.any(Error));
      expect(result).toEqual(mockBlacklistEntry);

      consoleSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    const queryDto: QueryBlacklistDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    it('should return paginated blacklist entries', async () => {
      const entries = [mockBlacklistEntry];
      const total = 1;

      mockBlacklistModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      exec: jest.fn().mockResolvedValue(entries),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockBlacklistModel.countDocuments.mockResolvedValue(total);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({ entries, total });
    });

    it('should apply filters correctly', async () => {
      const queryWithFilters: QueryBlacklistDto = {
        ...queryDto,
        status: BlacklistStatus.ACTIVE,
        reason: BlacklistReason.SPAM,
        search: 'test',
      };

      mockBlacklistModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      exec: jest.fn().mockResolvedValue([]),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockBlacklistModel.countDocuments.mockResolvedValue(0);

      await service.findAll(queryWithFilters);

      expect(mockBlacklistModel.find).toHaveBeenCalledWith({
        status: BlacklistStatus.ACTIVE,
        reason: BlacklistReason.SPAM,
        description: { $regex: 'test', $options: 'i' },
      });
    });
  });

  describe('findById', () => {
    const entryId = new Types.ObjectId().toString();

    it('should return blacklist entry by id', async () => {
      mockBlacklistModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockBlacklistEntry),
              }),
            }),
          }),
        }),
      });

      const result = await service.findById(entryId);

      expect(result).toEqual(mockBlacklistEntry);
      expect(mockBlacklistModel.findById).toHaveBeenCalledWith(entryId);
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockBlacklistModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
              }),
            }),
          }),
        }),
      });

      await expect(service.findById(entryId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    const userId = new Types.ObjectId().toString();

    it('should return blacklist entries for user', async () => {
      const entries = [mockBlacklistEntry];

      mockBlacklistModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(entries),
            }),
          }),
        }),
      });

      const result = await service.findByUserId(userId);

      expect(result).toEqual(entries);
      expect(mockBlacklistModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
      });
    });
  });

  describe('isUserBlacklisted', () => {
    const userId = new Types.ObjectId().toString();

    it('should return true when user is blacklisted', async () => {
      mockBlacklistModel.findOne.mockResolvedValue(mockBlacklistEntry);

      const result = await service.isUserBlacklisted(userId);

      expect(result).toBe(true);
      expect(mockBlacklistModel.findOne).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
        status: BlacklistStatus.ACTIVE,
      });
    });

    it('should return false when user is not blacklisted', async () => {
      mockBlacklistModel.findOne.mockResolvedValue(null);

      const result = await service.isUserBlacklisted(userId);

      expect(result).toBe(false);
    });
  });

  describe('approveEntry', () => {
    const entryId = new Types.ObjectId().toString();
    const adminId = new Types.ObjectId().toString();
    const approveDto: ApproveBlacklistEntryDto = {
      approved: true,
    };

    it('should approve blacklist entry', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBlacklistEntry);
      mockBlacklistModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBlacklistEntry),
      });

      const result = await service.approveEntry(entryId, approveDto, adminId);

      expect(mockBlacklistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        entryId,
        {
          approvedByAdmin: true,
          approvedBy: new Types.ObjectId(adminId),
          approvedAt: expect.any(Date),
        },
        { new: true }
      );
      expect(result).toEqual(mockBlacklistEntry);
    });
  });

  describe('revokeEntry', () => {
    const entryId = new Types.ObjectId().toString();
    const adminId = new Types.ObjectId().toString();
    const revokeDto: RevokeBlacklistEntryDto = {
      revocationReason: 'Appeal approved',
    };

    it('should revoke active blacklist entry', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBlacklistEntry);
      mockBlacklistModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBlacklistEntry),
      });
      mockUsersService.updateUserBlockStatus.mockResolvedValue(undefined);

      const result = await service.revokeEntry(entryId, revokeDto, adminId);

      expect(mockBlacklistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        entryId,
        {
          status: BlacklistStatus.REVOKED,
          revokedBy: new Types.ObjectId(adminId),
          revokedAt: expect.any(Date),
          revocationReason: revokeDto.revocationReason,
        },
        { new: true }
      );
      expect(mockUsersService.updateUserBlockStatus).toHaveBeenCalledWith(
        mockBlacklistEntry.userId.toString(),
        false
      );
      expect(result).toEqual(mockBlacklistEntry);
    });

    it('should throw ForbiddenException when entry is not active', async () => {
      const inactiveEntry = { ...mockBlacklistEntry, status: BlacklistStatus.EXPIRED };
      jest.spyOn(service, 'findById').mockResolvedValue(inactiveEntry);

      await expect(service.revokeEntry(entryId, revokeDto, adminId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('updateEntry', () => {
    const entryId = new Types.ObjectId().toString();
    const updateDto: UpdateBlacklistEntryDto = {
      status: BlacklistStatus.ACTIVE,
    };

    it('should update blacklist entry', async () => {
      mockBlacklistModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBlacklistEntry),
      });

      const result = await service.updateEntry(entryId, updateDto);

      expect(mockBlacklistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        entryId,
        updateDto,
        { new: true }
      );
      expect(result).toEqual(mockBlacklistEntry);
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockBlacklistModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateEntry(entryId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEntry', () => {
    const entryId = new Types.ObjectId().toString();

    it('should delete active blacklist entry and unblock user', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBlacklistEntry);
      mockBlacklistModel.findByIdAndDelete.mockResolvedValue(mockBlacklistEntry);
      mockUsersService.updateUserBlockStatus.mockResolvedValue(undefined);

      await service.deleteEntry(entryId);

      expect(mockUsersService.updateUserBlockStatus).toHaveBeenCalledWith(
        mockBlacklistEntry.userId.toString(),
        false
      );
      expect(mockBlacklistModel.findByIdAndDelete).toHaveBeenCalledWith(entryId);
    });

    it('should delete inactive blacklist entry without unblocking user', async () => {
      const inactiveEntry = { ...mockBlacklistEntry, status: BlacklistStatus.EXPIRED };
      jest.spyOn(service, 'findById').mockResolvedValue(inactiveEntry);
      mockBlacklistModel.findByIdAndDelete.mockResolvedValue(inactiveEntry);

      await service.deleteEntry(entryId);

      expect(mockUsersService.updateUserBlockStatus).not.toHaveBeenCalled();
      expect(mockBlacklistModel.findByIdAndDelete).toHaveBeenCalledWith(entryId);
    });
  });

  describe('processExpiredEntries', () => {
    it('should process expired blacklist entries', async () => {
      const expiredEntries = [mockBlacklistEntry];
      mockBlacklistModel.find.mockResolvedValue(expiredEntries);
      mockBlacklistModel.findByIdAndUpdate.mockResolvedValue(mockBlacklistEntry);
      mockUsersService.updateUserBlockStatus.mockResolvedValue(undefined);

      await service.processExpiredEntries();

      expect(mockBlacklistModel.find).toHaveBeenCalledWith({
        status: BlacklistStatus.ACTIVE,
        expiresAt: { $lte: expect.any(Date) },
      });
      expect(mockBlacklistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBlacklistEntry._id,
        {
          status: BlacklistStatus.EXPIRED,
          autoExpired: true,
          autoExpiredAt: expect.any(Date),
        }
      );
      expect(mockUsersService.updateUserBlockStatus).toHaveBeenCalledWith(
        mockBlacklistEntry.userId.toString(),
        false
      );
    });

    it('should handle empty expired entries', async () => {
      mockBlacklistModel.find.mockResolvedValue([]);

      await service.processExpiredEntries();

      expect(mockBlacklistModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockUsersService.updateUserBlockStatus).not.toHaveBeenCalled();
    });
  });

  describe('getBlacklistStats', () => {
    it('should return blacklist statistics', async () => {
      const statusStats = [
        { _id: BlacklistStatus.ACTIVE, count: 10 },
        { _id: BlacklistStatus.EXPIRED, count: 5 },
      ];
      const reasonStats = [
        { _id: 'spam', count: 8 },
        { _id: 'abuse', count: 7 },
      ];

      mockBlacklistModel.aggregate
        .mockResolvedValueOnce(statusStats)
        .mockResolvedValueOnce(reasonStats);

      const result = await service.getBlacklistStats();

      expect(result).toEqual({ statusStats, reasonStats });
    });
  });

  describe('calculateExpirationDate', () => {
    it('should calculate expiration date based on severity', () => {
      const severity = 2;
      const result = service['calculateExpirationDate'](severity);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + (severity * 7));
      
      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -1000);
    });
  });
});
