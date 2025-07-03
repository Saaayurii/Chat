import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlacklistEntry, BlacklistDocument, BlacklistStatus, BlacklistReason, BlacklistType } from '../schemas/blacklist-entry.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class BlacklistSeeder {
  constructor(
    @InjectModel(BlacklistEntry.name) private blacklistModel: Model<BlacklistDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding blacklist entries...');

    // Проверяем, есть ли уже записи в черном списке
    const existingEntriesCount = await this.blacklistModel.countDocuments();
    if (existingEntriesCount > 0) {
      console.log('🚫 Blacklist entries already exist, skipping blacklist seeding');
      return;
    }

    // Получаем пользователей
    const visitors = await this.userModel.find({ role: UserRole.VISITOR }).limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });
    const admins = await this.userModel.find({ role: UserRole.ADMIN });

    if (visitors.length === 0 || operators.length === 0 || admins.length === 0) {
      console.log('⚠️  No users found, skipping blacklist seeding');
      return;
    }

    const blacklistEntries = [
      // Активные записи в черном списке
      {
        userId: visitors[0]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.ABUSE,
        status: BlacklistStatus.ACTIVE,
        addedById: operators[0]?._id, // Добавлен оператором
        description: 'Пользователь использовал нецензурную лексику и угрожал сотрудникам поддержки',
        internalNotes: 'Множественные нарушения. Предыдущие предупреждения игнорировались.',
        duration: 30, // дней
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        createdAt: new Date(Date.now() - 86400000), // 1 день назад
      },
      {
        userId: visitors[1]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.SPAM,
        status: BlacklistStatus.ACTIVE,
        addedById: operators[1]?._id,
        description: 'Массовая отправка одинаковых сообщений в чат поддержки',
        internalNotes: 'Отправил 50+ одинаковых сообщений за 1 час',
        duration: 7, // дней
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 172800000), // 2 дня назад
      },
      {
        userId: visitors[2]?._id,
        type: BlacklistType.ADMIN_BLACKLIST,
        reason: BlacklistReason.FRAUD,
        status: BlacklistStatus.ACTIVE,
        addedById: admins[0]?._id, // Добавлен администратором
        description: 'Попытка мошенничества - выдавал себя за сотрудника компании',
        internalNotes: 'Пытался получить доступ к персональным данным других клиентов',
        duration: 365, // год
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 259200000), // 3 дня назад
      },
      {
        userId: visitors[3]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.INAPPROPRIATE_BEHAVIOR,
        status: BlacklistStatus.ACTIVE,
        addedById: operators[2]?._id,
        description: 'Неподобающее поведение в чате - домогательства к женщинам-операторам',
        internalNotes: 'Получены жалобы от 3 сотрудниц. Поведение недопустимо.',
        duration: 90, // дней
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 345600000), // 4 дня назад
      },

      // Записи на рассмотрении
      {
        userId: visitors[4]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.POLICY_VIOLATION,
        status: BlacklistStatus.PENDING_REVIEW,
        addedById: operators[3]?._id,
        description: 'Нарушение пользовательского соглашения - использование сервиса в коммерческих целях без соответствующего тарифа',
        internalNotes: 'Требуется дополнительная проверка и подтверждение от юридического отдела',
        duration: 30,
        createdAt: new Date(Date.now() - 43200000), // 12 часов назад
      },
      {
        userId: visitors[0]?._id, // Повторное нарушение
        type: BlacklistType.ADMIN_BLACKLIST,
        reason: BlacklistReason.REPEATED_VIOLATIONS,
        status: BlacklistStatus.PENDING_REVIEW,
        addedById: admins[1]?._id,
        description: 'Повторные нарушения после снятия предыдущей блокировки',
        internalNotes: 'Пользователь продолжает нарушать правила. Рассматривается постоянная блокировка.',
        duration: 0, // постоянно
        createdAt: new Date(Date.now() - 21600000), // 6 часов назад
      },

      // Одобренные записи
      {
        userId: visitors[1]?._id, // Тот же пользователь, что и выше - продление блокировки
        type: BlacklistType.ADMIN_BLACKLIST,
        reason: BlacklistReason.SPAM,
        status: BlacklistStatus.APPROVED,
        addedById: operators[0]?._id,
        approvedById: admins[0]?._id,
        approvedAt: new Date(Date.now() - 86400000), // 1 день назад
        description: 'Продолжение спам-активности после предупреждения',
        internalNotes: 'Спам продолжился. Одобрено увеличение срока блокировки.',
        adminComments: 'Блокировка одобрена. Увеличен срок до 30 дней.',
        duration: 30,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 432000000), // 5 дней назад
      },

      // Отклоненные записи
      {
        userId: visitors[2]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.INAPPROPRIATE_BEHAVIOR,
        status: BlacklistStatus.REJECTED,
        addedById: operators[1]?._id,
        reviewedById: admins[1]?._id,
        reviewedAt: new Date(Date.now() - 172800000), // 2 дня назад
        description: 'Грубость в общении с оператором',
        internalNotes: 'Жалоба на грубость, но без серьезных нарушений',
        adminComments: 'Недостаточно оснований для блокировки. Выдано предупреждение.',
        rejectionReason: 'Инцидент не достигает уровня, требующего блокировки',
        createdAt: new Date(Date.now() - 518400000), // 6 дней назад
      },

      // Отозванные записи
      {
        userId: visitors[3]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.ABUSE,
        status: BlacklistStatus.REVOKED,
        addedById: operators[2]?._id,
        revokedById: admins[0]?._id,
        revokedAt: new Date(Date.now() - 259200000), // 3 дня назад
        description: 'Ошибочно внесен в черный список',
        internalNotes: 'Изначальная жалоба оказалась ложной',
        adminComments: 'После расследования выяснилось, что обвинения были ложными',
        revocationReason: 'Ошибочное внесение в черный список. Жалоба была ложной.',
        originalDuration: 15,
        createdAt: new Date(Date.now() - 604800000), // 7 дней назад
      },

      // Истекшие записи
      {
        userId: visitors[4]?._id,
        type: BlacklistType.USER_BLACKLIST,
        reason: BlacklistReason.POLICY_VIOLATION,
        status: BlacklistStatus.EXPIRED,
        addedById: operators[3]?._id,
        description: 'Нарушение условий использования',
        internalNotes: 'Срок блокировки истек, пользователь реабилитирован',
        duration: 7,
        expiresAt: new Date(Date.now() - 86400000), // истекла вчера
        createdAt: new Date(Date.now() - 691200000), // 8 дней назад
      },

      // Статистические данные
      ...Array.from({ length: 8 }, (_, i) => ({
        userId: visitors[i % visitors.length]?._id,
        type: i % 2 === 0 ? BlacklistType.USER_BLACKLIST : BlacklistType.ADMIN_BLACKLIST,
        reason: [
          BlacklistReason.SPAM,
          BlacklistReason.ABUSE,
          BlacklistReason.INAPPROPRIATE_BEHAVIOR,
          BlacklistReason.POLICY_VIOLATION,
          BlacklistReason.FRAUD
        ][i % 5],
        status: [
          BlacklistStatus.ACTIVE,
          BlacklistStatus.EXPIRED,
          BlacklistStatus.REVOKED,
          BlacklistStatus.REJECTED
        ][i % 4],
        addedById: i % 2 === 0 ? operators[i % operators.length]?._id : admins[i % admins.length]?._id,
        description: `Тестовая запись ${i + 1} для статистики`,
        internalNotes: `Внутренние заметки для записи ${i + 1}`,
        duration: [7, 14, 30, 90][i % 4],
        expiresAt: [
          BlacklistStatus.ACTIVE,
          BlacklistStatus.EXPIRED
        ].includes([
          BlacklistStatus.ACTIVE,
          BlacklistStatus.EXPIRED,
          BlacklistStatus.REVOKED,
          BlacklistStatus.REJECTED
        ][i % 4]) ? new Date(Date.now() + (i % 4 === 1 ? -1 : 1) * [7, 14, 30, 90][i % 4] * 24 * 60 * 60 * 1000) : undefined,
        approvedAt: i % 4 === 0 && i % 2 === 1 ? new Date(Date.now() - (i + 1) * 86400000) : undefined,
        approvedById: i % 4 === 0 && i % 2 === 1 ? admins[i % admins.length]?._id : undefined,
        reviewedAt: i % 4 === 3 ? new Date(Date.now() - (i + 1) * 86400000) : undefined,
        reviewedById: i % 4 === 3 ? admins[i % admins.length]?._id : undefined,
        revokedAt: i % 4 === 2 ? new Date(Date.now() - (i + 1) * 86400000) : undefined,
        revokedById: i % 4 === 2 ? admins[i % admins.length]?._id : undefined,
        createdAt: new Date(Date.now() - (i + 2) * 86400000),
      })),
    ];

    try {
      const createdEntries = await this.blacklistModel.insertMany(blacklistEntries);
      console.log(`✅ Successfully created ${createdEntries.length} blacklist entries`);
      
      console.log('\n📋 Blacklist statistics:');
      console.log(`  🔴 Active: ${blacklistEntries.filter(e => e.status === BlacklistStatus.ACTIVE).length}`);
      console.log(`  ⏳ Pending Review: ${blacklistEntries.filter(e => e.status === BlacklistStatus.PENDING_REVIEW).length}`);
      console.log(`  ✅ Approved: ${blacklistEntries.filter(e => e.status === BlacklistStatus.APPROVED).length}`);
      console.log(`  ❌ Rejected: ${blacklistEntries.filter(e => e.status === BlacklistStatus.REJECTED).length}`);
      console.log(`  🔄 Revoked: ${blacklistEntries.filter(e => e.status === BlacklistStatus.REVOKED).length}`);
      console.log(`  ⏰ Expired: ${blacklistEntries.filter(e => e.status === BlacklistStatus.EXPIRED).length}`);
      
      console.log('\n📊 By type:');
      console.log(`  👤 User Blacklist: ${blacklistEntries.filter(e => e.type === BlacklistType.USER_BLACKLIST).length}`);
      console.log(`  👑 Admin Blacklist: ${blacklistEntries.filter(e => e.type === BlacklistType.ADMIN_BLACKLIST).length}`);
      
    } catch (error) {
      console.error('❌ Error seeding blacklist entries:', error);
      throw error;
    }
  }

  async clear() {
    console.log('🧹 Clearing blacklist collection...');
    await this.blacklistModel.deleteMany({});
    console.log('✅ Blacklist collection cleared');
  }
}