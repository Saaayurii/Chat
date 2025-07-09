import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole, UserDocument } from '../database/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { CreateOperatorDto } from './dto/create-operator.dto/create-operator.dto';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto/delete-user.dto';
import { Types } from 'mongoose';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUser: jest.fn(),
    createOperator: jest.fn(),
    findAllUsers: jest.fn(),
    findOperators: jest.fn(),
    getUsersStats: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    toggleUserBlock: jest.fn(),
    activateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockCurrentUser = {
    _id: new Types.ObjectId(),
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    isBlocked: false,
  } as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
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
      bio: 'Test bio',
      role: UserRole.VISITOR,
    };

    it('should create a new user', async () => {
      const expectedResult = {
        _id: new Types.ObjectId(),
        email: createUserDto.email,
        role: createUserDto.role,
      };

      mockUsersService.createUser.mockResolvedValue(expectedResult);

      const result = await controller.createUser(createUserDto);

      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
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

    it('should create a new operator', async () => {
      const expectedResult = {
        _id: new Types.ObjectId(),
        email: createOperatorDto.email,
        role: UserRole.OPERATOR,
      };

      mockUsersService.createOperator.mockResolvedValue(expectedResult);

      const result = await controller.createOperator(createOperatorDto);

      expect(service.createOperator).toHaveBeenCalledWith(createOperatorDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users with default parameters', async () => {
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockUsersService.findAllUsers.mockResolvedValue(expectedResult);

      const result = await controller.findAllUsers(1, 10);

      expect(service.findAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: undefined,
        search: undefined,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should return paginated users with filters', async () => {
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockUsersService.findAllUsers.mockResolvedValue(expectedResult);

      const result = await controller.findAllUsers(1, 10, UserRole.OPERATOR, 'search');

      expect(service.findAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: UserRole.OPERATOR,
        search: 'search',
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOperators', () => {
    it('should return all operators', async () => {
      const expectedResult = [
        {
          _id: new Types.ObjectId(),
          email: 'operator1@example.com',
          role: UserRole.OPERATOR,
        },
      ];

      mockUsersService.findOperators.mockResolvedValue(expectedResult);

      const result = await controller.findOperators();

      expect(service.findOperators).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should return only online operators', async () => {
      const expectedResult = [
        {
          _id: new Types.ObjectId(),
          email: 'operator1@example.com',
          role: UserRole.OPERATOR,
        },
      ];

      mockUsersService.findOperators.mockResolvedValue(expectedResult);

      const result = await controller.findOperators(true);

      expect(service.findOperators).toHaveBeenCalledWith(true);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUsersStats', () => {
    it('should return users statistics', async () => {
      const expectedResult = {
        total: 100,
        active: 90,
        blocked: 10,
        online: 30,
        registeredToday: 5,
        byRole: {
          admin: 2,
          operator: 8,
          visitor: 90,
        },
      };

      mockUsersService.getUsersStats.mockResolvedValue(expectedResult);

      const result = await controller.getUsersStats();

      expect(service.getUsersStats).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findUserById', () => {
    const userId = new Types.ObjectId().toString();

    it('should return user by id', async () => {
      const expectedResult = {
        _id: userId,
        email: 'user@example.com',
        role: UserRole.VISITOR,
      };

      mockUsersService.findUserById.mockResolvedValue(expectedResult);

      const result = await controller.findUserById(userId, mockCurrentUser);

      expect(service.findUserById).toHaveBeenCalledWith(userId, mockCurrentUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateUser', () => {
    const userId = new Types.ObjectId().toString();
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      isBlocked: false,
    };

    it('should update user', async () => {
      const expectedResult = {
        _id: userId,
        email: updateUserDto.email,
        isBlocked: updateUserDto.isBlocked,
      };

      mockUsersService.updateUser.mockResolvedValue(expectedResult);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('toggleUserBlock', () => {
    const userId = new Types.ObjectId().toString();

    it('should toggle user block status', async () => {
      const expectedResult = { isBlocked: true };

      mockUsersService.toggleUserBlock.mockResolvedValue(expectedResult);

      const result = await controller.toggleUserBlock(userId, mockCurrentUser);

      expect(service.toggleUserBlock).toHaveBeenCalledWith(userId, mockCurrentUser._id.toString());
      expect(result).toEqual(expectedResult);
    });
  });

  describe('activateUser', () => {
    const userId = new Types.ObjectId().toString();

    it('should activate user', async () => {
      const expectedResult = { isActivated: true };

      mockUsersService.activateUser.mockResolvedValue(expectedResult);

      const result = await controller.activateUser(userId);

      expect(service.activateUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteUser', () => {
    const userId = new Types.ObjectId().toString();
    const deleteUserDto: DeleteUserDto = {
      reason: 'Violation of terms',
      additionalInfo: 'Spam activity',
    };

    it('should delete user', async () => {
      const expectedResult = { message: 'Пользователь успешно удален' };

      mockUsersService.deleteUser.mockResolvedValue(expectedResult);

      const result = await controller.deleteUser(userId, deleteUserDto, mockCurrentUser);

      expect(service.deleteUser).toHaveBeenCalledWith(
        userId,
        deleteUserDto,
        mockCurrentUser._id.toString()
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
