import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

@Injectable()
export class UsersSeeder {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding users...');

    // Проверяем, есть ли уже пользователи
    const existingUsersCount = await this.userModel.countDocuments();
    if (existingUsersCount > 0) {
      console.log('👥 Users already exist, skipping users seeding');
      return;
    }

    const saltRounds = 12;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);

    const users = [
      // Администраторы
      {
        email: 'admin@chatsystem.com',
        passwordHash: defaultPassword,
        role: UserRole.ADMIN,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'admin',
          fullName: 'Главный Администратор',
          phone: '+79001234567',
          bio: 'Системный администратор чат-системы',
          lastSeenAt: new Date(),
          isOnline: false,
        },
      },
      {
        email: 'admin2@chatsystem.com',
        passwordHash: defaultPassword,
        role: UserRole.ADMIN,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'admin_alex',
          fullName: 'Александр Админов',
          phone: '+79001234568',
          bio: 'Администратор по техническим вопросам',
          lastSeenAt: new Date(Date.now() - 3600000), // 1 час назад
          isOnline: false,
        },
      },
      
      // Операторы
      {
        email: 'operator1@chatsystem.com',
        passwordHash: defaultPassword,
        role: UserRole.OPERATOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'op_maria',
          fullName: 'Мария Операторова',
          phone: '+79001234569',
          bio: 'Специалист по общим вопросам. Опыт работы 3 года.',
          lastSeenAt: new Date(),
          isOnline: true,
        },
        operatorStats: {
          totalQuestions: 156,
          resolvedQuestions: 142,
          averageRating: 4.7,
          totalRatings: 89,
          responseTimeAvg: 12.5, // минуты
        },
      },
      {
        email: 'operator2@chatsystem.com',
        passwordHash: defaultPassword,
        role: UserRole.OPERATOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'op_denis',
          fullName: 'Денис Техников',
          phone: '+79001234570',
          bio: 'Технический специалист. Помогу с техническими проблемами.',
          lastSeenAt: new Date(Date.now() - 1800000), // 30 минут назад
          isOnline: true,
        },
        operatorStats: {
          totalQuestions: 203,
          resolvedQuestions: 189,
          averageRating: 4.8,
          totalRatings: 134,
          responseTimeAvg: 8.2,
        },
      },
      {
        email: 'operator3@chatsystem.com',
        passwordHash: defaultPassword,
        role: UserRole.OPERATOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'op_anna',
          fullName: 'Анна Консультант',
          phone: '+79001234571',
          bio: 'Консультант по биллингу и финансовым вопросам.',
          lastSeenAt: new Date(Date.now() - 7200000), // 2 часа назад
          isOnline: false,
        },
        operatorStats: {
          totalQuestions: 98,
          resolvedQuestions: 91,
          averageRating: 4.5,
          totalRatings: 67,
          responseTimeAvg: 15.8,
        },
      },
      {
        email: 'operator4@chatsystem.com',
        passwordHash: defaultPassword,
        role: UserRole.OPERATOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'op_pavel',
          fullName: 'Павел Поддержкин',
          phone: '+79001234572',
          bio: 'Старший оператор. Специализация: сложные технические вопросы.',
          lastSeenAt: new Date(Date.now() - 600000), // 10 минут назад
          isOnline: true,
        },
        operatorStats: {
          totalQuestions: 324,
          resolvedQuestions: 298,
          averageRating: 4.9,
          totalRatings: 201,
          responseTimeAvg: 6.1,
        },
      },
      
      // Посетители (клиенты)
      {
        email: 'user1@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'ivan_petrov',
          fullName: 'Иван Петров',
          phone: '+79001234573',
          bio: 'Клиент компании',
          lastSeenAt: new Date(),
          isOnline: true,
        },
      },
      {
        email: 'user2@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'elena_sidorova',
          fullName: 'Елена Сидорова',
          phone: '+79001234574',
          bio: 'Постоянный клиент',
          lastSeenAt: new Date(Date.now() - 3600000),
          isOnline: false,
        },
      },
      {
        email: 'user3@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'alex_kozlov',
          fullName: 'Александр Козлов',
          phone: '+79001234575',
          bio: 'Новый пользователь',
          lastSeenAt: new Date(Date.now() - 1800000),
          isOnline: false,
        },
      },
      {
        email: 'user4@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'olga_volkova',
          fullName: 'Ольга Волкова',
          phone: '+79001234576',
          bio: 'Корпоративный клиент',
          lastSeenAt: new Date(Date.now() - 7200000),
          isOnline: false,
        },
      },
      {
        email: 'user5@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: true,
        isBlocked: false,
        profile: {
          username: 'sergey_novikov',
          fullName: 'Сергей Новиков',
          phone: '+79001234577',
          bio: 'Частный клиент',
          lastSeenAt: new Date(Date.now() - 300000), // 5 минут назад
          isOnline: true,
        },
      },
      
      // Заблокированные пользователи для тестирования
      {
        email: 'blocked@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: true,
        isBlocked: true,
        blacklistedByAdmin: true,
        profile: {
          username: 'blocked_user',
          fullName: 'Заблокированный Пользователь',
          phone: '+79001234578',
          bio: 'Пользователь нарушил правила',
          lastSeenAt: new Date(Date.now() - 86400000), // 1 день назад
          isOnline: false,
        },
      },
      
      // Неактивированный пользователь
      {
        email: 'unactivated@example.com',
        passwordHash: defaultPassword,
        role: UserRole.VISITOR,
        isActivated: false,
        isBlocked: false,
        profile: {
          username: 'unactivated_user',
          fullName: 'Неактивированный Пользователь',
          phone: '+79001234579',
          bio: 'Пользователь не подтвердил email',
          lastSeenAt: new Date(Date.now() - 172800000), // 2 дня назад
          isOnline: false,
        },
      },
    ];

    try {
      const createdUsers = await this.userModel.insertMany(users);
      console.log(`✅ Successfully created ${createdUsers.length} users`);
      
      // Выводим информацию о созданных пользователях
      console.log('\n📋 Created users:');
      console.log('👑 Admins:');
      console.log('  - admin@chatsystem.com (password: password123)');
      console.log('  - admin2@chatsystem.com (password: password123)');
      
      console.log('\n👩‍💼 Operators:');
      console.log('  - operator1@chatsystem.com (Мария, онлайн)');
      console.log('  - operator2@chatsystem.com (Денис, онлайн)');
      console.log('  - operator3@chatsystem.com (Анна, оффлайн)');
      console.log('  - operator4@chatsystem.com (Павел, онлайн)');
      
      console.log('\n👥 Visitors:');
      console.log('  - user1@example.com (Иван, онлайн)');
      console.log('  - user2@example.com (Елена, оффлайн)');
      console.log('  - user3@example.com (Александр, оффлайн)');
      console.log('  - user4@example.com (Ольга, оффлайн)');
      console.log('  - user5@example.com (Сергей, онлайн)');
      
      console.log('\n🚫 Test users:');
      console.log('  - blocked@example.com (заблокирован)');
      console.log('  - unactivated@example.com (не активирован)');
      
      console.log('\n🔑 Default password for all users: password123\n');
      
    } catch (error) {
      console.error('❌ Error seeding users:', error);
      throw error;
    }
  }

  async clear() {
    console.log('🧹 Clearing users collection...');
    await this.userModel.deleteMany({});
    console.log('✅ Users collection cleared');
  }
}