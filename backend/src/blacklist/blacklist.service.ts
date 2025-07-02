import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { BlacklistEntry, BlacklistEntryDocument, BlacklistStatus, BlacklistType } from '../database/schemas/blacklist-entry.schema';
import { CreateBlacklistEntryDto } from './dto/create-blacklist-entry.dto';
import { UpdateBlacklistEntryDto, ApproveBlacklistEntryDto, RevokeBlacklistEntryDto } from './dto/update-blacklist-entry.dto';
import { QueryBlacklistDto } from './dto/query-blacklist.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectModel(BlacklistEntry.name) private blacklistModel: Model<BlacklistEntryDocument>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async createBlacklistEntry(
    createDto: CreateBlacklistEntryDto,
    blockedById: string,
  ): Promise<BlacklistEntry> {
    // Проверяем, не заблокирован ли уже пользователь
    const existingEntry = await this.blacklistModel.findOne({
      userId: new Types.ObjectId(createDto.userId),
      status: BlacklistStatus.ACTIVE,
    });

    if (existingEntry) {
      throw new ForbiddenException('Пользователь уже заблокирован');
    }

    // Вычисляем срок блокировки на основе серьезности
    const expiresAt = createDto.type === BlacklistType.TEMPORARY
      ? this.calculateExpirationDate(createDto.severity || 1)
      : undefined;

    const blacklistEntry = new this.blacklistModel({
      ...createDto,
      userId: new Types.ObjectId(createDto.userId),
      blockedBy: new Types.ObjectId(blockedById),
      relatedComplaints: createDto.relatedComplaints?.map(id => new Types.ObjectId(id)),
      relatedMessages: createDto.relatedMessages?.map(id => new Types.ObjectId(id)),
      expiresAt,
    });

    const savedEntry = await blacklistEntry.save();

    // Обновляем статус пользователя
    await this.usersService.updateUserBlockStatus(createDto.userId, true);

    // Отправляем уведомление пользователю
    try {
      const user = await this.usersService.findById(createDto.userId);
      if (user?.email) {
        await this.emailService.sendBlacklistNotificationEmail(
          user.email,
          createDto.reason,
          expiresAt ? expiresAt.toLocaleDateString() : 'постоянно'
        );
        
        await this.blacklistModel.findByIdAndUpdate(savedEntry._id, {
          userNotified: true,
          userNotifiedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to send blacklist notification:', error);
    }

    return savedEntry.populate(['userId', 'blockedBy', 'approvedBy']);
  }

  async findAll(queryDto: QueryBlacklistDto): Promise<{ entries: BlacklistEntry[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = queryDto;
    
    const query: any = {};
    
    // Применяем фильтры
    if (filters.status) query.status = filters.status;
    if (filters.reason) query.reason = filters.reason;
    if (filters.type) query.type = filters.type;
    if (filters.userId) query.userId = new Types.ObjectId(filters.userId);
    if (filters.blockedBy) query.blockedBy = new Types.ObjectId(filters.blockedBy);
    if (filters.approvedByAdmin !== undefined) query.approvedByAdmin = filters.approvedByAdmin;
    
    // Фильтр по дате
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Поиск по описанию
    if (filters.search) {
      query.description = { $regex: filters.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [entries, total] = await Promise.all([
      this.blacklistModel
        .find(query)
        .populate('userId', 'email profile.username profile.fullName')
        .populate('blockedBy', 'email profile.username profile.fullName')
        .populate('approvedBy', 'email profile.username profile.fullName')
        .populate('revokedBy', 'email profile.username profile.fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blacklistModel.countDocuments(query),
    ]);

    return { entries, total };
  }

  async findById(id: string): Promise<BlacklistEntry> {
    const entry = await this.blacklistModel
      .findById(id)
      .populate('userId', 'email profile.username profile.fullName')
      .populate('blockedBy', 'email profile.username profile.fullName')
      .populate('approvedBy', 'email profile.username profile.fullName')
      .populate('revokedBy', 'email profile.username profile.fullName')
      .exec();

    if (!entry) {
      throw new NotFoundException('Запись в черном списке не найдена');
    }

    return entry;
  }

  async findByUserId(userId: string): Promise<BlacklistEntry[]> {
    return this.blacklistModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('blockedBy', 'email profile.username profile.fullName')
      .populate('approvedBy', 'email profile.username profile.fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async isUserBlacklisted(userId: string): Promise<boolean> {
    const activeEntry = await this.blacklistModel.findOne({
      userId: new Types.ObjectId(userId),
      status: BlacklistStatus.ACTIVE,
    });

    return !!activeEntry;
  }

  async approveEntry(id: string, approveDto: ApproveBlacklistEntryDto, adminId: string): Promise<BlacklistEntry> {
    const entry = await this.findById(id);
    
    const updatedEntry = await this.blacklistModel.findByIdAndUpdate(
      id,
      {
        approvedByAdmin: approveDto.approved,
        approvedBy: new Types.ObjectId(adminId),
        approvedAt: new Date(),
      },
      { new: true }
    ).populate(['userId', 'blockedBy', 'approvedBy']);

    return updatedEntry!;
  }

  async revokeEntry(id: string, revokeDto: RevokeBlacklistEntryDto, adminId: string): Promise<BlacklistEntry> {
    const entry = await this.findById(id);
    
    if (entry.status !== BlacklistStatus.ACTIVE) {
      throw new ForbiddenException('Можно отменить только активную блокировку');
    }

    const updatedEntry = await this.blacklistModel.findByIdAndUpdate(
      id,
      {
        status: BlacklistStatus.REVOKED,
        revokedBy: new Types.ObjectId(adminId),
        revokedAt: new Date(),
        revocationReason: revokeDto.revocationReason,
      },
      { new: true }
    ).populate(['userId', 'blockedBy', 'approvedBy', 'revokedBy']);

    // Разблокируем пользователя
    await this.usersService.updateUserBlockStatus(entry.userId.toString(), false);

    return updatedEntry!;
  }

  async updateEntry(id: string, updateDto: UpdateBlacklistEntryDto): Promise<BlacklistEntry> {
    const updatedEntry = await this.blacklistModel.findByIdAndUpdate(
      id,
      updateDto,
      { new: true }
    ).populate(['userId', 'blockedBy', 'approvedBy', 'revokedBy']);

    if (!updatedEntry) {
      throw new NotFoundException('Запись в черном списке не найдена');
    }

    return updatedEntry;
  }

  async deleteEntry(id: string): Promise<void> {
    const entry = await this.findById(id);
    
    // Разблокируем пользователя если блокировка была активной
    if (entry.status === BlacklistStatus.ACTIVE) {
      await this.usersService.updateUserBlockStatus(entry.userId.toString(), false);
    }
    
    await this.blacklistModel.findByIdAndDelete(id);
  }

  async processExpiredEntries(): Promise<void> {
    const expiredEntries = await this.blacklistModel.find({
      status: BlacklistStatus.ACTIVE,
      expiresAt: { $lte: new Date() },
    });

    for (const entry of expiredEntries) {
      await this.blacklistModel.findByIdAndUpdate(entry._id, {
        status: BlacklistStatus.EXPIRED,
        autoExpired: true,
        autoExpiredAt: new Date(),
      });

      // Разблокируем пользователя
      await this.usersService.updateUserBlockStatus(entry.userId.toString(), false);
    }
  }

  private calculateExpirationDate(severity: number): Date {
    const days = severity * 7; // 1 неделя за каждый уровень серьезности
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  async getBlacklistStats(): Promise<any> {
    const stats = await this.blacklistModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const reasonStats = await this.blacklistModel.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
    ]);

    return { statusStats: stats, reasonStats };
  }
}
