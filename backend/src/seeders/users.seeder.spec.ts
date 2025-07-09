import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersSeeder } from './users.seeder';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

describe('UsersSeeder', () => {
  let seeder: UsersSeeder;
  let userModel: Model<UserDocument>;

  const mockUserModel = {
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersSeeder,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    seeder = module.get<UsersSeeder>(UsersSeeder);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seed', () => {
    it('should skip seeding if sufficient users already exist', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUserModel.countDocuments
        .mockResolvedValueOnce(2) // admin count
        .mockResolvedValueOnce(4) // operator count
        .mockResolvedValueOnce(5); // visitor count

      await seeder.seed();

      expect(mockUserModel.countDocuments).toHaveBeenCalledTimes(3);
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({ role: UserRole.ADMIN });
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({ role: UserRole.OPERATOR });
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({ 
        role: UserRole.VISITOR, 
        isActivated: true, 
        isBlocked: false 
      });

      expect(mockUserModel.deleteMany).not.toHaveBeenCalled();
      expect(mockUserModel.insertMany).not.toHaveBeenCalled();

      expect(consoleSpy).toHaveBeenCalledWith('👥 Users already exist in sufficient numbers, skipping users seeding');

      consoleSpy.mockRestore();
    });

    it('should clear existing users and create new ones', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUserModel.countDocuments
        .mockResolvedValueOnce(1) // admin count
        .mockResolvedValueOnce(2) // operator count
        .mockResolvedValueOnce(3); // visitor count

      const mockCreatedUsers = Array.from({ length: 10 }, (_, i) => ({
        _id: `user${i}`,
        email: `user${i}@example.com`,
      }));

      mockUserModel.deleteMany.mockResolvedValue({ deletedCount: 6 });
      mockUserModel.insertMany.mockResolvedValue(mockCreatedUsers);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      await seeder.seed();

      expect(mockUserModel.countDocuments).toHaveBeenCalledTimes(3);
      expect(mockUserModel.deleteMany).toHaveBeenCalledWith({});
      expect(mockUserModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            email: 'admin@chatsystem.com',
            role: UserRole.ADMIN,
            isActivated: true,
            isBlocked: false,
          }),
          expect.objectContaining({
            email: 'operator1@chatsystem.com',
            role: UserRole.OPERATOR,
            isActivated: true,
            isBlocked: false,
          }),
          expect.objectContaining({
            email: 'user1@example.com',
            role: UserRole.VISITOR,
            isActivated: true,
            isBlocked: false,
          }),
          expect.objectContaining({
            email: 'blocked@example.com',
            role: UserRole.VISITOR,
            isActivated: true,
            isBlocked: true,
          }),
          expect.objectContaining({
            email: 'unactivated@example.com',
            role: UserRole.VISITOR,
            isActivated: false,
            isBlocked: false,
          }),
        ])
      );

      expect(consoleSpy).toHaveBeenCalledWith('🌱 Seeding users...');
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Clearing existing users to recreate...');
      expect(consoleSpy).toHaveBeenCalledWith(`✅ Successfully created ${mockCreatedUsers.length} users`);

      consoleSpy.mockRestore();
    });

    it('should create users without clearing when none exist', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUserModel.countDocuments
        .mockResolvedValueOnce(0) // admin count
        .mockResolvedValueOnce(0) // operator count
        .mockResolvedValueOnce(0); // visitor count

      const mockCreatedUsers = Array.from({ length: 10 }, (_, i) => ({
        _id: `user${i}`,
        email: `user${i}@example.com`,
      }));

      mockUserModel.insertMany.mockResolvedValue(mockCreatedUsers);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      await seeder.seed();

      expect(mockUserModel.countDocuments).toHaveBeenCalledTimes(3);
      expect(mockUserModel.deleteMany).not.toHaveBeenCalled();
      expect(mockUserModel.insertMany).toHaveBeenCalled();

      expect(consoleSpy).toHaveBeenCalledWith('🌱 Seeding users...');
      expect(consoleSpy).toHaveBeenCalledWith('Found existing users: 0 admins, 0 operators, 0 visitors');
      expect(consoleSpy).toHaveBeenCalledWith(`✅ Successfully created ${mockCreatedUsers.length} users`);

      consoleSpy.mockRestore();
    });

    it('should handle errors during seeding', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUserModel.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const error = new Error('Database error');
      mockUserModel.insertMany.mockRejectedValue(error);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      await expect(seeder.seed()).rejects.toThrow(error);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error seeding users:', error);

      consoleSpy.mockRestore();
    });

    it('should create users with correct password hashing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUserModel.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const mockCreatedUsers = [{ _id: 'user1', email: 'user1@example.com' }];
      mockUserModel.insertMany.mockResolvedValue(mockCreatedUsers);

      const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      await seeder.seed();

      expect(hashSpy).toHaveBeenCalledWith('password123', 12);
      expect(mockUserModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            passwordHash: 'hashedPassword',
          }),
        ])
      );

      hashSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should create users with all required roles', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUserModel.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const mockCreatedUsers = Array.from({ length: 10 }, (_, i) => ({
        _id: `user${i}`,
        email: `user${i}@example.com`,
      }));

      mockUserModel.insertMany.mockResolvedValue(mockCreatedUsers);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      await seeder.seed();

      const insertedUsers = mockUserModel.insertMany.mock.calls[0][0];
      
      const adminUsers = insertedUsers.filter(user => user.role === UserRole.ADMIN);
      const operatorUsers = insertedUsers.filter(user => user.role === UserRole.OPERATOR);
      const visitorUsers = insertedUsers.filter(user => user.role === UserRole.VISITOR);

      expect(adminUsers).toHaveLength(2);
      expect(operatorUsers).toHaveLength(4);
      expect(visitorUsers).toHaveLength(7); // 5 normal + 1 blocked + 1 unactivated

      // Check that all users have required fields
      insertedUsers.forEach(user => {
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('passwordHash');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('isActivated');
        expect(user).toHaveProperty('isBlocked');
        expect(user).toHaveProperty('profile');
        expect(user.profile).toHaveProperty('username');
        expect(user.profile).toHaveProperty('fullName');
        expect(user.profile).toHaveProperty('phone');
        expect(user.profile).toHaveProperty('bio');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all users from the collection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUserModel.deleteMany.mockResolvedValue({ deletedCount: 10 });

      await seeder.clear();

      expect(mockUserModel.deleteMany).toHaveBeenCalledWith({});
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Clearing users collection...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Users collection cleared');

      consoleSpy.mockRestore();
    });
  });
});