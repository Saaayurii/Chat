import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { BlacklistController } from './blacklist.controller';
import { BlacklistService } from './blacklist.service';
import { CreateBlacklistEntryDto } from './dto/create-blacklist-entry.dto';
import { UpdateBlacklistEntryDto, ApproveBlacklistEntryDto, RevokeBlacklistEntryDto } from './dto/update-blacklist-entry.dto';
import { QueryBlacklistDto } from './dto/query-blacklist.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthenticatedRequest } from '../common/interfaces/auth-request.interface';
import { UserRole } from '../database/schemas/user.schema';
import { BlacklistStatus, BlacklistType, BlacklistReason } from '../database/schemas/blacklist-entry.schema';

describe('BlacklistController', () => {
  let controller: BlacklistController;
  let service: BlacklistService;

  const mockBlacklistService = {
    createBlacklistEntry: jest.fn(),
    findAll: jest.fn(),
    getBlacklistStats: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    isUserBlacklisted: jest.fn(),
    approveEntry: jest.fn(),
    revokeEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    processExpiredEntries: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockParseObjectIdPipe = {
    transform: jest.fn().mockImplementation((value) => value),
  };

  const mockAdminUser = {
    _id: new Types.ObjectId(),
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockAuthenticatedRequest: AuthenticatedRequest = {
    user: mockAdminUser,
  } as any;

  const mockBlacklistEntry = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    blockedBy: new Types.ObjectId(),
    reason: BlacklistReason.SPAM,
    description: 'User was sending spam messages',
    type: BlacklistType.TEMPORARY,
    status: BlacklistStatus.ACTIVE,
    severity: 2,
    expiresAt: new Date('2025-01-01'),
    createdAt: new Date(),
    userNotified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlacklistController],
      providers: [
        {
          provide: BlacklistService,
          useValue: mockBlacklistService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overridePipe(ParseObjectIdPipe)
      .useValue(mockParseObjectIdPipe)
      .compile();

    controller = module.get<BlacklistController>(BlacklistController);
    service = module.get<BlacklistService>(BlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBlacklistEntry', () => {
    const createDto: CreateBlacklistEntryDto = {
      userId: new Types.ObjectId().toString(),
      reason: BlacklistReason.SPAM,
      description: 'User was sending spam messages',
      type: BlacklistType.TEMPORARY,
      severity: 2,
    };

    it('should create a new blacklist entry', async () => {
      mockBlacklistService.createBlacklistEntry.mockResolvedValue(mockBlacklistEntry);

      const result = await controller.createBlacklistEntry(createDto, mockAuthenticatedRequest);

      expect(service.createBlacklistEntry).toHaveBeenCalledWith(
        createDto,
        mockAdminUser._id.toString()
      );
      expect(result).toEqual(mockBlacklistEntry);
    });

    it('should handle service errors', async () => {
      mockBlacklistService.createBlacklistEntry.mockRejectedValue(
        new Error('User already blacklisted')
      );

      await expect(
        controller.createBlacklistEntry(createDto, mockAuthenticatedRequest)
      ).rejects.toThrow('User already blacklisted');
    });
  });

  describe('findAll', () => {
    const queryDto: QueryBlacklistDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: BlacklistStatus.ACTIVE,
    };

    it('should return paginated blacklist entries', async () => {
      const expectedResult = {
        entries: [mockBlacklistEntry],
        total: 1,
      };

      mockBlacklistService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      const expectedResult = {
        entries: [],
        total: 0,
      };

      mockBlacklistService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getStats', () => {
    it('should return blacklist statistics', async () => {
      const expectedStats = {
        statusStats: [
          { _id: BlacklistStatus.ACTIVE, count: 10 },
          { _id: BlacklistStatus.EXPIRED, count: 5 },
        ],
        reasonStats: [
          { _id: 'SPAM', count: 8 },
          { _id: 'HARASSMENT', count: 7 },
        ],
      };

      mockBlacklistService.getBlacklistStats.mockResolvedValue(expectedStats);

      const result = await controller.getStats();

      expect(service.getBlacklistStats).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });

  describe('findById', () => {
    const entryId = new Types.ObjectId().toString();

    it('should return blacklist entry by id', async () => {
      mockBlacklistService.findById.mockResolvedValue(mockBlacklistEntry);

      const result = await controller.findById(entryId);

      expect(service.findById).toHaveBeenCalledWith(entryId);
      expect(result).toEqual(mockBlacklistEntry);
    });

    it('should handle not found error', async () => {
      mockBlacklistService.findById.mockRejectedValue(
        new Error('Blacklist entry not found')
      );

      await expect(controller.findById(entryId)).rejects.toThrow(
        'Blacklist entry not found'
      );
    });
  });

  describe('findByUserId', () => {
    const userId = new Types.ObjectId().toString();

    it('should return blacklist entries for user', async () => {
      const expectedEntries = [mockBlacklistEntry];

      mockBlacklistService.findByUserId.mockResolvedValue(expectedEntries);

      const result = await controller.findByUserId(userId);

      expect(service.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedEntries);
    });

    it('should return empty array when no entries found', async () => {
      mockBlacklistService.findByUserId.mockResolvedValue([]);

      const result = await controller.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('checkUserBlacklist', () => {
    const userId = new Types.ObjectId().toString();

    it('should return true when user is blacklisted', async () => {
      mockBlacklistService.isUserBlacklisted.mockResolvedValue(true);

      const result = await controller.checkUserBlacklist(userId);

      expect(service.isUserBlacklisted).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ isBlacklisted: true });
    });

    it('should return false when user is not blacklisted', async () => {
      mockBlacklistService.isUserBlacklisted.mockResolvedValue(false);

      const result = await controller.checkUserBlacklist(userId);

      expect(service.isUserBlacklisted).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ isBlacklisted: false });
    });
  });

  describe('approveEntry', () => {
    const entryId = new Types.ObjectId().toString();
    const approveDto: ApproveBlacklistEntryDto = {
      approved: true,
    };

    it('should approve blacklist entry', async () => {
      const approvedEntry = {
        ...mockBlacklistEntry,
        approvedByAdmin: true,
        approvedBy: mockAdminUser._id,
        approvedAt: new Date(),
      };

      mockBlacklistService.approveEntry.mockResolvedValue(approvedEntry);

      const result = await controller.approveEntry(
        entryId,
        approveDto,
        mockAuthenticatedRequest
      );

      expect(service.approveEntry).toHaveBeenCalledWith(
        entryId,
        approveDto,
        mockAdminUser._id.toString()
      );
      expect(result).toEqual(approvedEntry);
    });

    it('should reject blacklist entry', async () => {
      const rejectDto: ApproveBlacklistEntryDto = {
        approved: false,
      };

      const rejectedEntry = {
        ...mockBlacklistEntry,
        approvedByAdmin: false,
        approvedBy: mockAdminUser._id,
        approvedAt: new Date(),
      };

      mockBlacklistService.approveEntry.mockResolvedValue(rejectedEntry);

      const result = await controller.approveEntry(
        entryId,
        rejectDto,
        mockAuthenticatedRequest
      );

      expect(service.approveEntry).toHaveBeenCalledWith(
        entryId,
        rejectDto,
        mockAdminUser._id.toString()
      );
      expect(result).toEqual(rejectedEntry);
    });
  });

  describe('revokeEntry', () => {
    const entryId = new Types.ObjectId().toString();
    const revokeDto: RevokeBlacklistEntryDto = {
      revocationReason: 'Appeal approved',
    };

    it('should revoke blacklist entry', async () => {
      const revokedEntry = {
        ...mockBlacklistEntry,
        status: BlacklistStatus.REVOKED,
        revokedBy: mockAdminUser._id,
        revokedAt: new Date(),
        revocationReason: revokeDto.revocationReason,
      };

      mockBlacklistService.revokeEntry.mockResolvedValue(revokedEntry);

      const result = await controller.revokeEntry(
        entryId,
        revokeDto,
        mockAuthenticatedRequest
      );

      expect(service.revokeEntry).toHaveBeenCalledWith(
        entryId,
        revokeDto,
        mockAdminUser._id.toString()
      );
      expect(result).toEqual(revokedEntry);
    });

    it('should handle revocation of non-active entry', async () => {
      mockBlacklistService.revokeEntry.mockRejectedValue(
        new Error('Can only revoke active entries')
      );

      await expect(
        controller.revokeEntry(entryId, revokeDto, mockAuthenticatedRequest)
      ).rejects.toThrow('Can only revoke active entries');
    });
  });

  describe('updateEntry', () => {
    const entryId = new Types.ObjectId().toString();
    const updateDto: UpdateBlacklistEntryDto = {
      status: BlacklistStatus.ACTIVE,
    };

    it('should update blacklist entry', async () => {
      const updatedEntry = {
        ...mockBlacklistEntry,
        status: updateDto.status,
        updatedAt: new Date(),
      };

      mockBlacklistService.updateEntry.mockResolvedValue(updatedEntry);

      const result = await controller.updateEntry(entryId, updateDto);

      expect(service.updateEntry).toHaveBeenCalledWith(entryId, updateDto);
      expect(result).toEqual(updatedEntry);
    });

    it('should handle update of non-existent entry', async () => {
      mockBlacklistService.updateEntry.mockRejectedValue(
        new Error('Blacklist entry not found')
      );

      await expect(controller.updateEntry(entryId, updateDto)).rejects.toThrow(
        'Blacklist entry not found'
      );
    });
  });

  describe('deleteEntry', () => {
    const entryId = new Types.ObjectId().toString();

    it('should delete blacklist entry', async () => {
      mockBlacklistService.deleteEntry.mockResolvedValue(undefined);

      await controller.deleteEntry(entryId);

      expect(service.deleteEntry).toHaveBeenCalledWith(entryId);
    });

    it('should handle deletion of non-existent entry', async () => {
      mockBlacklistService.deleteEntry.mockRejectedValue(
        new Error('Blacklist entry not found')
      );

      await expect(controller.deleteEntry(entryId)).rejects.toThrow(
        'Blacklist entry not found'
      );
    });
  });

  describe('processExpiredEntries', () => {
    it('should process expired entries successfully', async () => {
      mockBlacklistService.processExpiredEntries.mockResolvedValue(undefined);

      const result = await controller.processExpiredEntries();

      expect(service.processExpiredEntries).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Просроченные записи обработаны' });
    });

    it('should handle processing errors', async () => {
      mockBlacklistService.processExpiredEntries.mockRejectedValue(
        new Error('Database error')
      );

      await expect(controller.processExpiredEntries()).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('Authorization and Guards', () => {
    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', BlacklistController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should have RolesGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', BlacklistController);
      expect(guards).toContain(RolesGuard);
    });

    it('should require ADMIN role for most endpoints', () => {
      const createRoles = Reflect.getMetadata('roles', controller.createBlacklistEntry);
      const findAllRoles = Reflect.getMetadata('roles', controller.findAll);
      const getStatsRoles = Reflect.getMetadata('roles', controller.getStats);
      const findByIdRoles = Reflect.getMetadata('roles', controller.findById);
      const deleteRoles = Reflect.getMetadata('roles', controller.deleteEntry);

      expect(createRoles).toContain(UserRole.ADMIN);
      expect(findAllRoles).toContain(UserRole.ADMIN);
      expect(getStatsRoles).toContain(UserRole.ADMIN);
      expect(findByIdRoles).toContain(UserRole.ADMIN);
      expect(deleteRoles).toContain(UserRole.ADMIN);
    });

    it('should allow OPERATOR role for checkUserBlacklist', () => {
      const checkRoles = Reflect.getMetadata('roles', controller.checkUserBlacklist);
      expect(checkRoles).toContain(UserRole.ADMIN);
      expect(checkRoles).toContain(UserRole.OPERATOR);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const serviceError = new Error('Service error');
      mockBlacklistService.findById.mockRejectedValue(serviceError);

      await expect(controller.findById('invalid-id')).rejects.toThrow(
        'Service error'
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      mockBlacklistService.createBlacklistEntry.mockRejectedValue(validationError);

      const createDto: CreateBlacklistEntryDto = {
        userId: 'invalid-id',
        reason: BlacklistReason.SPAM,
        description: 'Test',
        type: BlacklistType.TEMPORARY,
        severity: 1,
      };

      await expect(
        controller.createBlacklistEntry(createDto, mockAuthenticatedRequest)
      ).rejects.toThrow('Validation failed');
    });
  });
});