import { Test, TestingModule } from '@nestjs/testing';
import { MainSeeder } from './main.seeder';
import { UsersSeeder } from './users.seeder';
import { QuestionsSeeder } from './questions.seeder';
import { ComplaintsSeeder } from './complaints.seeder';
import { BlacklistSeeder } from './blacklist.seeder';
import { RatingsSeeder } from './ratings.seeder';
import { ConversationsSeeder } from './conversations.seeder';

describe('MainSeeder', () => {
  let mainSeeder: MainSeeder;
  let usersSeeder: UsersSeeder;
  let questionsSeeder: QuestionsSeeder;
  let complaintsSeeder: ComplaintsSeeder;
  let blacklistSeeder: BlacklistSeeder;
  let ratingsSeeder: RatingsSeeder;
  let conversationsSeeder: ConversationsSeeder;

  const mockUsersSeeder = {
    seed: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const mockQuestionsSeeder = {
    seed: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const mockComplaintsSeeder = {
    seed: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const mockBlacklistSeeder = {
    seed: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const mockRatingsSeeder = {
    seed: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const mockConversationsSeeder = {
    seed: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MainSeeder,
        {
          provide: UsersSeeder,
          useValue: mockUsersSeeder,
        },
        {
          provide: QuestionsSeeder,
          useValue: mockQuestionsSeeder,
        },
        {
          provide: ComplaintsSeeder,
          useValue: mockComplaintsSeeder,
        },
        {
          provide: BlacklistSeeder,
          useValue: mockBlacklistSeeder,
        },
        {
          provide: RatingsSeeder,
          useValue: mockRatingsSeeder,
        },
        {
          provide: ConversationsSeeder,
          useValue: mockConversationsSeeder,
        },
      ],
    }).compile();

    mainSeeder = module.get<MainSeeder>(MainSeeder);
    usersSeeder = module.get<UsersSeeder>(UsersSeeder);
    questionsSeeder = module.get<QuestionsSeeder>(QuestionsSeeder);
    complaintsSeeder = module.get<ComplaintsSeeder>(ComplaintsSeeder);
    blacklistSeeder = module.get<BlacklistSeeder>(BlacklistSeeder);
    ratingsSeeder = module.get<RatingsSeeder>(RatingsSeeder);
    conversationsSeeder = module.get<ConversationsSeeder>(ConversationsSeeder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seedAll', () => {
    it('should call all seeders in correct order', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await mainSeeder.seedAll();

      expect(usersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(questionsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(complaintsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(blacklistSeeder.seed).toHaveBeenCalledTimes(1);
      expect(ratingsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(conversationsSeeder.seed).toHaveBeenCalledTimes(1);

      // Verify order by checking call order
      const calls = [
        usersSeeder.seed,
        questionsSeeder.seed,
        complaintsSeeder.seed,
        blacklistSeeder.seed,
        ratingsSeeder.seed,
        conversationsSeeder.seed,
      ];

      // Check that all methods were called
      calls.forEach(call => {
        expect(call).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting database seeding...\n');
      expect(consoleSpy).toHaveBeenCalledWith('🎉 Database seeding completed successfully!');

      consoleSpy.mockRestore();
    });

    it('should handle errors during seeding', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Seeding failed');
      
      mockUsersSeeder.seed.mockRejectedValue(error);

      await expect(mainSeeder.seedAll()).rejects.toThrow(error);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error during database seeding:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('clearAll', () => {
    it('should clear all collections in reverse order', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await mainSeeder.clearAll();

      expect(conversationsSeeder.clear).toHaveBeenCalledTimes(1);
      expect(ratingsSeeder.clear).toHaveBeenCalledTimes(1);
      expect(blacklistSeeder.clear).toHaveBeenCalledTimes(1);
      expect(complaintsSeeder.clear).toHaveBeenCalledTimes(1);
      expect(questionsSeeder.clear).toHaveBeenCalledTimes(1);
      expect(usersSeeder.clear).toHaveBeenCalledTimes(1);

      // Verify reverse order by checking call order
      const calls = [
        conversationsSeeder.clear,
        ratingsSeeder.clear,
        blacklistSeeder.clear,
        complaintsSeeder.clear,
        questionsSeeder.clear,
        usersSeeder.clear,
      ];

      // Check that all methods were called
      calls.forEach(call => {
        expect(call).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith('🧹 Clearing all collections...\n');
      expect(consoleSpy).toHaveBeenCalledWith('\n✅ All collections cleared successfully!');

      consoleSpy.mockRestore();
    });

    it('should handle errors during clearing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Clearing failed');
      
      mockConversationsSeeder.clear.mockRejectedValue(error);

      await expect(mainSeeder.clearAll()).rejects.toThrow(error);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error during database clearing:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('reseedAll', () => {
    it('should clear and then seed all collections', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock the methods to track their calls
      const clearAllSpy = jest.spyOn(mainSeeder, 'clearAll');
      const seedAllSpy = jest.spyOn(mainSeeder, 'seedAll');

      await mainSeeder.reseedAll();

      expect(clearAllSpy).toHaveBeenCalledTimes(1);
      expect(seedAllSpy).toHaveBeenCalledTimes(1);
      expect(clearAllSpy).toHaveBeenCalled();
      expect(seedAllSpy).toHaveBeenCalled();

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Reseeding database (clear and seed)...\n');

      consoleSpy.mockRestore();
    });

    it('should handle errors during reseeding', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Reseeding failed');
      
      jest.spyOn(mainSeeder, 'clearAll').mockRejectedValue(error);

      await expect(mainSeeder.reseedAll()).rejects.toThrow(error);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error during database reseeding:', error);

      consoleSpy.mockRestore();
    });
  });
});