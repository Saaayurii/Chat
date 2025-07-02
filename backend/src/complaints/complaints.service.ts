import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Complaint, ComplaintDocument, ComplaintStatus } from '../database/schemas/complaint.schema';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto, ReviewComplaintDto } from './dto/update-complaint.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { BaseQueryFilter, UpdateData } from '../common/interfaces/query-filter.interface';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<ComplaintDocument>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async createComplaint(createDto: CreateComplaintDto, visitorId: string): Promise<Complaint> {
    const complaint = new this.complaintModel({
      ...createDto,
      visitorId: new Types.ObjectId(visitorId),
      operatorId: new Types.ObjectId(createDto.operatorId),
      relatedQuestionId: createDto.relatedQuestionId 
        ? new Types.ObjectId(createDto.relatedQuestionId) 
        : undefined,
      relatedConversationId: createDto.relatedConversationId 
        ? new Types.ObjectId(createDto.relatedConversationId) 
        : undefined,
    });

    const savedComplaint = await complaint.save();
    
    // Отправляем уведомление пользователю
    try {
      const visitor = await this.usersService.findById(visitorId);
      if (visitor?.email) {
        await this.emailService.sendComplaintReceivedEmail(
          visitor.email,
          (savedComplaint._id as string).toString()
        );
      }
    } catch (error) {
      console.error('Failed to send complaint notification:', error);
    }

    return savedComplaint.populate(['visitorId', 'operatorId']);
  }

  async findAll(queryDto: QueryComplaintsDto): Promise<{ complaints: Complaint[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = queryDto;
    
    const query: BaseQueryFilter = {};
    
    // Применяем фильтры
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.severity) query.severity = filters.severity;
    if (filters.visitorId) query.visitorId = new Types.ObjectId(filters.visitorId);
    if (filters.operatorId) query.operatorId = new Types.ObjectId(filters.operatorId);
    if (filters.reviewedBy) query.reviewedBy = new Types.ObjectId(filters.reviewedBy);
    
    // Фильтр нерассмотренных жалоб
    if (filters.unreviewed) {
      query.status = ComplaintStatus.PENDING;
    }
    
    // Фильтр жалоб, требующих последующего контроля
    if (filters.followUpRequired) {
      query.followUpRequired = true;
      query.followUpDate = { $lte: new Date() };
    }
    
    // Фильтр по дате
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Поиск по тексту
    if (filters.search) {
      query.complaintText = { $regex: filters.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [complaints, total] = await Promise.all([
      this.complaintModel
        .find(query)
        .populate('visitorId', 'email profile.username profile.fullName')
        .populate('operatorId', 'email profile.username profile.fullName')
        .populate('reviewedBy', 'email profile.username profile.fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.complaintModel.countDocuments(query),
    ]);

    return { complaints, total };
  }

  async findById(id: string): Promise<Complaint> {
    const complaint = await this.complaintModel
      .findById(id)
      .populate('visitorId', 'email profile.username profile.fullName')
      .populate('operatorId', 'email profile.username profile.fullName')
      .populate('reviewedBy', 'email profile.username profile.fullName')
      .exec();

    if (!complaint) {
      throw new NotFoundException('Жалоба не найдена');
    }

    return complaint;
  }

  async findByUserId(userId: string): Promise<Complaint[]> {
    return this.complaintModel
      .find({ visitorId: new Types.ObjectId(userId) })
      .populate('operatorId', 'email profile.username profile.fullName')
      .populate('reviewedBy', 'email profile.username profile.fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByOperatorId(operatorId: string): Promise<Complaint[]> {
    return this.complaintModel
      .find({ operatorId: new Types.ObjectId(operatorId) })
      .populate('visitorId', 'email profile.username profile.fullName')
      .populate('reviewedBy', 'email profile.username profile.fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async reviewComplaint(id: string, reviewDto: ReviewComplaintDto, reviewedById: string): Promise<Complaint> {
    const complaint = await this.findById(id);
    
    if (complaint.status !== ComplaintStatus.PENDING) {
      throw new ForbiddenException('Можно рассмотреть только ожидающие жалобы');
    }

    const updateData: UpdateData = {
      status: reviewDto.status,
      adminResponse: reviewDto.adminResponse,
      resolutionNotes: reviewDto.resolutionNotes,
      reviewedBy: new Types.ObjectId(reviewedById),
      reviewedAt: new Date(),
    };

    if (reviewDto.status === ComplaintStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
      
      // Применяем меры к оператору
      if (reviewDto.warnOperator) {
        updateData.operatorWarned = true;
      }
      
      if (reviewDto.suspendOperator && reviewDto.suspensionDuration) {
        updateData.operatorSuspended = true;
        updateData.suspensionDuration = reviewDto.suspensionDuration;
        
        // Приостанавливаем оператора
        await this.suspendOperator(complaint.operatorId.toString(), reviewDto.suspensionDuration);
      }
    }

    const updatedComplaint = await this.complaintModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate(['visitorId', 'operatorId', 'reviewedBy']);

    return updatedComplaint!;
  }

  async updateComplaint(id: string, updateDto: UpdateComplaintDto): Promise<Complaint> {
    const updateData: UpdateData = { ...updateDto };
    
    if (updateDto.followUpDate) {
      updateData.followUpDate = new Date(updateDto.followUpDate);
    }

    const updatedComplaint = await this.complaintModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate(['visitorId', 'operatorId', 'reviewedBy']);

    if (!updatedComplaint) {
      throw new NotFoundException('Жалоба не найдена');
    }

    return updatedComplaint;
  }

  async deleteComplaint(id: string): Promise<void> {
    const complaint = await this.findById(id);
    await this.complaintModel.findByIdAndDelete(id);
  }

  private async suspendOperator(operatorId: string, durationDays: number): Promise<void> {
    const suspensionEndDate = new Date();
    suspensionEndDate.setDate(suspensionEndDate.getDate() + durationDays);
    
    // Обновляем статус оператора
    await this.usersService.suspendUser(operatorId, suspensionEndDate);
    
    // Отправляем уведомление
    try {
      const operator = await this.usersService.findById(operatorId);
      if (operator?.email) {
        await this.emailService.sendEmail({
          to: operator.email,
          subject: 'Уведомление о приостановке',
          html: `
            <h2>Уведомление о приостановке</h2>
            <p>Ваш аккаунт приостановлен на ${durationDays} дней в связи с жалобой.</p>
            <p>Приостановка действует до: ${suspensionEndDate.toLocaleDateString()}</p>
          `,
        });
      }
    } catch (error) {
      console.error('Failed to send suspension notification:', error);
    }
  }

  async getComplaintStats(): Promise<any> {
    const statusStats = await this.complaintModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStats = await this.complaintModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const severityStats = await this.complaintModel.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const operatorComplaintStats = await this.complaintModel.aggregate([
      {
        $group: {
          _id: '$operatorId',
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: {
              $cond: [{ $eq: ['$status', ComplaintStatus.RESOLVED] }, 1, 0],
            },
          },
        },
      },
      { $sort: { totalComplaints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'operator',
        },
      },
      { $unwind: '$operator' },
    ]);

    const avgResolutionTime = await this.complaintModel.aggregate([
      {
        $match: {
          status: ComplaintStatus.RESOLVED,
          resolvedAt: { $exists: true },
        },
      },
      {
        $addFields: {
          resolutionTimeHours: {
            $divide: [
              { $subtract: ['$resolvedAt', '$createdAt'] },
              1000 * 60 * 60, // конвертируем в часы
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTimeHours' },
        },
      },
    ]);

    return {
      statusStats,
      typeStats,
      severityStats,
      operatorStats: operatorComplaintStats,
      avgResolutionTimeHours: avgResolutionTime[0]?.avgResolutionTime || 0,
    };
  }

  async getOperatorComplaintHistory(operatorId: string): Promise<{
    complaints: Complaint[];
    totalComplaints: number;
    resolvedComplaints: number;
    warningsCount: number;
    suspensionsCount: number;
  }> {
    const complaints = await this.findByOperatorId(operatorId);
    
    const stats = {
      totalComplaints: complaints.length,
      resolvedComplaints: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
      warningsCount: complaints.filter(c => c.operatorWarned).length,
      suspensionsCount: complaints.filter(c => c.operatorSuspended).length,
    };

    return {
      complaints,
      ...stats,
    };
  }
}
