import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlacklistEntry,
  BlacklistEntryDocument,
  BlacklistReason,
  BlacklistType,
  BlacklistStatus,
} from '../database/schemas/blacklist-entry.schema';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

@Injectable()
export class BlacklistSeeder {
  constructor(
    @InjectModel(BlacklistEntry.name)
    private blacklistModel: Model<BlacklistEntryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding blacklist entries...');

    const existingCount = await this.blacklistModel.countDocuments();
    if (existingCount > 0) {
      console.log('⏩ Blacklist already seeded');
      return;
    }

    const admins = await this.userModel.find({ role: UserRole.ADMIN }).limit(1);
    const visitors = await this.userModel
      .find({ role: UserRole.VISITOR })
      .limit(5);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });

    if (admins.length === 0 || visitors.length === 0) {
      console.log('⚠️ Not enough users for blacklist seeding');
      return;
    }

    if (visitors.length < 2 || operators.length < 2 || admins.length < 1) {
      console.warn(`❌ Not enough users to seed blacklist entries
Found: ${visitors.length} visitors, ${operators.length} operators, ${admins.length} admins`);
      return;
    }

    const entries = [
      {
        userId: visitors[0]._id,
        blockedBy: admins[0]._id,
        reason: BlacklistReason.SPAM,
        description: 'Пользователь рассылал рекламу в общем чате.',
        type: BlacklistType.TEMPORARY,
        status: BlacklistStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        severity: 2,
        userNotified: true,
        userNotifiedAt: new Date(),
      },
      {
        userId: visitors[1]._id,
        blockedBy: admins[0]._id,
        reason: BlacklistReason.HARASSMENT,
        description: 'Агрессивное поведение по отношению к операторам.',
        type: BlacklistType.PERMANENT,
        status: BlacklistStatus.ACTIVE,
        severity: 5,
        userNotified: true,
        userNotifiedAt: new Date(),
      },
    ];

    try {
      const inserted = await this.blacklistModel.insertMany(entries);
      console.log(`✅ Inserted ${inserted.length} blacklist entries`);
    } catch (error) {
      console.error('❌ Error seeding blacklist:', error);
    }
  }

  async clear() {
    await this.blacklistModel.deleteMany({});
    console.log('✅ Cleared blacklist entries');
  }
}
