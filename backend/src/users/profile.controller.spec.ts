import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { UserDocument, UserRole } from '../database/schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { MulterFile } from './interfaces/multer-file.interface';
import { Types } from 'mongoose';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
    getOnlineStatus: jest.fn(),
    updateOnlineStatus: jest.fn(),
    getProfileStatistics: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockCurrentUser = {
    _id: new Types.ObjectId(),
    email: 'user@example.com',
    role: UserRole.VISITOR,
    isBlocked: false,
    profile: {
      username: 'testuser',
      fullName: 'Test User',
      phone: '+1234567890',
      bio: 'Test bio',
      isOnline: true,
      lastSeenAt: new Date(),
    },
  } as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    it('should return user profile', async () => {
      const expectedResult = {
        _id: mockCurrentUser._id,
        email: mockCurrentUser.email,
        role: mockCurrentUser.role,
        profile: mockCurrentUser.profile,
      };

      mockUsersService.getProfile.mockResolvedValue(expectedResult);

      const result = await controller.getMyProfile(mockCurrentUser);

      expect(service.getProfile).toHaveBeenCalledWith(mockCurrentUser._id.toString());
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateMyProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      username: 'newusername',
      fullName: 'New Full Name',
      phone: '+0987654321',
      bio: 'Updated bio',
    };

    it('should update user profile', async () => {
      const expectedResult = {
        _id: mockCurrentUser._id,
        email: mockCurrentUser.email,
        role: mockCurrentUser.role,
        profile: {
          ...mockCurrentUser.profile,
          ...updateProfileDto,
        },
      };

      mockUsersService.updateProfile.mockResolvedValue(expectedResult);

      const result = await controller.updateMyProfile(mockCurrentUser, updateProfileDto);

      expect(service.updateProfile).toHaveBeenCalledWith(
        mockCurrentUser._id.toString(),
        updateProfileDto
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('uploadAvatar', () => {
    const mockFile: MulterFile = {
      fieldname: 'avatar',
      originalname: 'avatar.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
      size: 1024 * 1024, // 1MB
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload avatar successfully', async () => {
      const expectedResult = {
        avatarUrl: '/uploads/avatars/avatar.jpg',
      };

      mockUsersService.uploadAvatar.mockResolvedValue(expectedResult);

      const result = await controller.uploadAvatar(mockCurrentUser, mockFile);

      expect(service.uploadAvatar).toHaveBeenCalledWith(
        mockCurrentUser._id.toString(),
        mockFile
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getOnlineStatus', () => {
    it('should return online status', async () => {
      const expectedResult = {
        isOnline: true,
        lastSeenAt: new Date(),
      };

      mockUsersService.getOnlineStatus.mockResolvedValue(expectedResult);

      const result = await controller.getOnlineStatus(mockCurrentUser);

      expect(service.getOnlineStatus).toHaveBeenCalledWith(mockCurrentUser._id.toString());
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateOnlineStatus', () => {
    it('should update online status to true', async () => {
      const expectedResult = {
        isOnline: true,
      };

      mockUsersService.updateOnlineStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateOnlineStatus(mockCurrentUser, true);

      expect(service.updateOnlineStatus).toHaveBeenCalledWith(
        mockCurrentUser._id.toString(),
        true
      );
      expect(result).toEqual(expectedResult);
    });

    it('should update online status to false', async () => {
      const expectedResult = {
        isOnline: false,
      };

      mockUsersService.updateOnlineStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateOnlineStatus(mockCurrentUser, false);

      expect(service.updateOnlineStatus).toHaveBeenCalledWith(
        mockCurrentUser._id.toString(),
        false
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfileStatistics', () => {
    it('should return profile statistics for visitor', async () => {
      const expectedResult = {
        role: UserRole.VISITOR,
        profileCompleteness: 85,
        accountAge: {
          days: 30,
          months: 1,
        },
      };

      mockUsersService.getProfileStatistics.mockResolvedValue(expectedResult);

      const result = await controller.getProfileStatistics(mockCurrentUser);

      expect(service.getProfileStatistics).toHaveBeenCalledWith(mockCurrentUser._id.toString());
      expect(result).toEqual(expectedResult);
    });

    it('should return profile statistics for operator', async () => {
      const operatorUser = {
        ...mockCurrentUser,
        role: UserRole.OPERATOR,
      } as UserDocument;

      const expectedResult = {
        role: UserRole.OPERATOR,
        operatorStats: {
          totalQuestions: 156,
          resolvedQuestions: 142,
          averageRating: 4.7,
          totalRatings: 89,
          responseTimeAvg: 12.5,
        },
        profileCompleteness: 90,
        accountAge: {
          days: 45,
          months: 1,
        },
      };

      mockUsersService.getProfileStatistics.mockResolvedValue(expectedResult);

      const result = await controller.getProfileStatistics(operatorUser);

      expect(service.getProfileStatistics).toHaveBeenCalledWith(operatorUser._id.toString());
      expect(result).toEqual(expectedResult);
    });
  });
});
