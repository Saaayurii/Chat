import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { 
  ConflictException, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { CreateOperatorDto } from './dto/create-operator.dto/create-operator.dto';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { DeleteUserDto } from './dto/delete-user.dto/delete-user.dto';
import { UploadedFile } from './interfaces/uploaded-file.interface';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<UserDocument>;

  const mockUserModel = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    toObject: jest.fn(),
  })) as any;

  mockUserModel.findOne = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.find = jest.fn();
  mockUserModel.countDocuments = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    role: UserRole.VISITOR,
    isBlocked: false,
    isActivated: true,
    blacklistedByAdmin: false,
    blacklistedByOperator: false,
    profile: {
      username: 'testuser',
      fullName: 'Test User',
      phone: '+1234567890',
      bio: 'Test bio',
      isOnline: false,
      lastSeenAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    toObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      fullName: 'New User',
      phone: '+1234567890',
      bio: 'New user bio',
      role: UserRole.VISITOR,
    };

    it('should create a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      const newUser = {
        ...mockUser,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          toObject: jest.fn().mockReturnValue(mockUser),
        }),
      };
      
      mockUserModel.mockReturnValue(newUser);
      
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      const result = await service.createUser(createUserDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email.toLowerCase(),
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        'profile.username': createUserDto.username,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when username already exists', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should create operator with operator stats', async () => {
      const operatorDto = { ...createUserDto, role: UserRole.OPERATOR };
      mockUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      const newUser = {
        ...mockUser,
        role: UserRole.OPERATOR,
        operatorStats: {
          totalQuestions: 0,
          resolvedQuestions: 0,
          averageRating: 0,
          totalRatings: 0,
          responseTimeAvg: 0,
        },
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          toObject: jest.fn().mockReturnValue({ ...mockUser, role: UserRole.OPERATOR }),
        }),
      };
      
      mockUserModel.mockReturnValue(newUser);
      
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      const result = await service.createUser(operatorDto);

      expect(result).toBeDefined();
      expect(result.role).toBe(UserRole.OPERATOR);
    });
  });

  describe('createOperator', () => {
    const createOperatorDto: CreateOperatorDto = {
      email: 'operator@example.com',
      username: 'operator',
      fullName: 'Operator User',
      phone: '+1234567890',
      bio: 'Operator bio',
      temporaryPassword: 'temp123',
    };

    it('should create operator with temporary password', async () => {
      jest.spyOn(service, 'createUser').mockResolvedValue(mockUser as any);

      const result = await service.createOperator(createOperatorDto);

      expect(service.createUser).toHaveBeenCalledWith({
        email: createOperatorDto.email,
        password: createOperatorDto.temporaryPassword,
        username: createOperatorDto.username,
        fullName: createOperatorDto.fullName,
        phone: createOperatorDto.phone,
        bio: createOperatorDto.bio,
        role: UserRole.OPERATOR,
      });
      expect(result).toBeDefined();
    });

    it('should generate temporary password when not provided', async () => {
      const dtoWithoutPassword = { ...createOperatorDto };
      delete dtoWithoutPassword.temporaryPassword;

      jest.spyOn(service, 'createUser').mockResolvedValue(mockUser as any);
      jest.spyOn(service as any, 'generateTemporaryPassword').mockReturnValue('generatedPass');

      await service.createOperator(dtoWithoutPassword);

      expect(service.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'generatedPass',
          role: UserRole.OPERATOR,
        })
      );
    });
  });

  describe('findAllUsers', () => {
    const params = {
      page: 1,
      limit: 10,
      role: UserRole.VISITOR,
      search: 'test',
    };

    it('should return paginated users with filters', async () => {
      const users = [mockUser, mockUser];
      const total = 2;

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(users),
              }),
            }),
          }),
        }),
      });

      mockUserModel.countDocuments.mockResolvedValue(total);

      const result = await service.findAllUsers(params);

      expect(result).toEqual({
        data: users,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      });

      expect(mockUserModel.find).toHaveBeenCalledWith({
        role: params.role,
        $or: [
          { email: { $regex: params.search, $options: 'i' } },
          { 'profile.username': { $regex: params.search, $options: 'i' } },
          { 'profile.fullName': { $regex: params.search, $options: 'i' } },
        ],
      });
    });

    it('should return users without filters', async () => {
      const paramsWithoutFilters = { page: 1, limit: 10 };
      const users = [mockUser];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(users),
              }),
            }),
          }),
        }),
      });

      mockUserModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAllUsers(paramsWithoutFilters);

      expect(result.data).toEqual(users);
      expect(mockUserModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOperators', () => {
    it('should return all operators', async () => {
      const operators = [mockUser];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(operators),
          }),
        }),
      });

      const result = await service.findOperators();

      expect(result).toEqual(operators);
      expect(mockUserModel.find).toHaveBeenCalledWith({
        role: UserRole.OPERATOR,
        isBlocked: false,
      });
    });

    it('should return only online operators', async () => {
      const operators = [mockUser];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(operators),
          }),
        }),
      });

      const result = await service.findOperators(true);

      expect(result).toEqual(operators);
      expect(mockUserModel.find).toHaveBeenCalledWith({
        role: UserRole.OPERATOR,
        isBlocked: false,
        'profile.isOnline': true,
      });
    });
  });

  describe('findUserById', () => {
    const userId = new Types.ObjectId().toString();
    const currentUser = { ...mockUser, role: UserRole.ADMIN } as unknown as UserDocument;

    it('should return user by id for admin', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            toObject: jest.fn().mockReturnValue(mockUser),
          }),
        }),
      });

      const result = await service.findUserById(userId, currentUser);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.findUserById('invalid-id', currentUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findUserById(userId, currentUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException for visitor accessing other profile', async () => {
      const visitorUser = { ...mockUser, role: UserRole.VISITOR } as unknown as UserDocument;
      const otherUserId = new Types.ObjectId().toString();

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            toObject: jest.fn().mockReturnValue(mockUser),
          }),
        }),
      });

      await expect(service.findUserById(otherUserId, visitorUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('updateUser', () => {
    const userId = new Types.ObjectId().toString();
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      isBlocked: false,
    };

    it('should update user successfully', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            toObject: jest.fn().mockReturnValue({ ...mockUser, ...updateUserDto }),
          }),
        }),
      });

      const result = await service.updateUser(userId, updateUserDto);

      expect(result).toBeDefined();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          ...updateUserDto,
          email: updateUserDto.email?.toLowerCase(),
        },
        { new: true, runValidators: true }
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.updateUser('invalid-id', updateUserDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.updateUser(userId, updateUserDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('updateProfile', () => {
    const userId = new Types.ObjectId().toString();
    const updateProfileDto: UpdateProfileDto = {
      username: 'newusername',
      fullName: 'New Full Name',
      phone: '+0987654321',
      bio: 'New bio',
    };

    it('should update profile successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            toObject: jest.fn().mockReturnValue({ ...mockUser, profile: updateProfileDto }),
          }),
        }),
      });

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(result).toBeDefined();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          $set: {
            'profile.username': updateProfileDto.username,
            'profile.fullName': updateProfileDto.fullName,
            'profile.phone': updateProfileDto.phone,
            'profile.avatarUrl': updateProfileDto.avatarUrl,
            'profile.bio': updateProfileDto.bio,
          },
        },
        { new: true, runValidators: true }
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.updateProfile(userId, updateProfileDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.updateProfile(userId, updateProfileDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('uploadAvatar', () => {
    const userId = new Types.ObjectId().toString();
    const validFile: UploadedFile = {
      fieldname: 'avatar',
      originalname: 'avatar.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024 * 1024, // 1MB
      buffer: Buffer.from('fake image data'),
    };

    it('should upload avatar successfully', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await service.uploadAvatar(userId, validFile);

      expect(result).toHaveProperty('avatarUrl');
      expect(result.avatarUrl).toContain('uploads/avatars/');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { 'profile.avatarUrl': expect.stringContaining('uploads/avatars/') } }
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...validFile, mimetype: 'text/plain' };

      await expect(service.uploadAvatar(userId, invalidFile)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for oversized file', async () => {
      const oversizedFile = { ...validFile, size: 3 * 1024 * 1024 }; // 3MB

      await expect(service.uploadAvatar(userId, oversizedFile)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('toggleUserBlock', () => {
    const userId = new Types.ObjectId().toString();
    const adminId = new Types.ObjectId().toString();

    it('should block user when not blocked', async () => {
      const user = { ...mockUser, isBlocked: false };
      mockUserModel.findById.mockResolvedValue(user);
      mockUserModel.findByIdAndUpdate.mockResolvedValue(user);

      const result = await service.toggleUserBlock(userId, adminId);

      expect(result).toEqual({ isBlocked: true });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        isBlocked: true,
        blacklistedByAdmin: true,
      });
    });

    it('should unblock user when blocked', async () => {
      const user = { ...mockUser, isBlocked: true };
      mockUserModel.findById.mockResolvedValue(user);
      mockUserModel.findByIdAndUpdate.mockResolvedValue(user);

      const result = await service.toggleUserBlock(userId, adminId);

      expect(result).toEqual({ isBlocked: false });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        isBlocked: false,
        blacklistedByAdmin: false,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.toggleUserBlock(userId, adminId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteUser', () => {
    const userId = new Types.ObjectId().toString();
    const adminId = new Types.ObjectId().toString();
    const deleteUserDto: DeleteUserDto = {
      reason: 'Violation of terms',
      additionalInfo: 'Spam activity',
    };

    it('should soft delete user', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await service.deleteUser(userId, deleteUserDto, adminId);

      expect(result).toEqual({ message: 'Пользователь успешно удален' });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        isBlocked: true,
        blacklistedByAdmin: true,
        $set: {
          'deletionInfo.deletedAt': expect.any(Date),
          'deletionInfo.deletedBy': adminId,
          'deletionInfo.reason': deleteUserDto.reason,
          'deletionInfo.additionalInfo': deleteUserDto.additionalInfo,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.deleteUser(userId, deleteUserDto, adminId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should validate user with correct credentials', async () => {
      const user = {
        ...mockUser,
        toObject: jest.fn().mockReturnValue(mockUser),
      };
      mockUserModel.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: email.toLowerCase(),
        isBlocked: false,
      });
    });

    it('should return null for invalid credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('getUsersStats', () => {
    it('should return users statistics', async () => {
      const mockCounts = [100, 90, 10, 5, 20, 75, 30, 15];
      mockUserModel.countDocuments.mockImplementation(() => {
        return Promise.resolve(mockCounts.shift() || 0);
      });

      const result = await service.getUsersStats();

      expect(result).toEqual({
        total: 100,
        active: 90,
        blocked: 10,
        online: 30,
        registeredToday: 15,
        byRole: {
          admin: 5,
          operator: 20,
          visitor: 75,
        },
      });
    });
  });

  describe('updateOnlineStatus', () => {
    const userId = new Types.ObjectId().toString();

    it('should update online status', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await service.updateOnlineStatus(userId, true);

      expect(result).toEqual({ isOnline: true });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        'profile.isOnline': true,
        'profile.lastSeenAt': expect.any(Date),
      });
    });
  });

  describe('getOnlineStatus', () => {
    const userId = new Types.ObjectId().toString();

    it('should return online status', async () => {
      const user = {
        profile: {
          isOnline: true,
          lastSeenAt: new Date(),
        },
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      const result = await service.getOnlineStatus(userId);

      expect(result).toEqual({
        isOnline: user.profile.isOnline,
        lastSeenAt: user.profile.lastSeenAt,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getOnlineStatus(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
