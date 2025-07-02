import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { OperatorRating, OperatorRatingDocument } from '../database/schemas/operator-rating.schema';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryRatingsDto, GetOperatorRatingsDto } from './dto/query-ratings.dto';
import { UpdateRatingVisibilityDto, HideRatingDto } from './dto/update-rating.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(OperatorRating.name) private ratingModel: Model<OperatorRatingDocument>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async createRating(createDto: CreateRatingDto, visitorId: string): Promise<OperatorRating> {
    // Проверяем, не оставлял ли уже пользователь оценку за этот вопрос
    if (createDto.relatedQuestionId) {
      const existingRating = await this.ratingModel.findOne({
        visitorId: new Types.ObjectId(visitorId),
        relatedQuestionId: new Types.ObjectId(createDto.relatedQuestionId),
      });

      if (existingRating) {
        throw new ForbiddenException('Вы уже оставляли оценку за этот вопрос');
      }
    }

    const rating = new this.ratingModel({
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

    const savedRating = await rating.save();
    return savedRating.populate(['visitorId', 'operatorId']);
  }

  async findAll(queryDto: QueryRatingsDto): Promise<{ ratings: OperatorRating[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = queryDto;
    
    const query: any = {};
    
    // Применяем фильтры
    if (filters.operatorId) query.operatorId = new Types.ObjectId(filters.operatorId);
    if (filters.visitorId) query.visitorId = new Types.ObjectId(filters.visitorId);
    if (filters.isVisible !== undefined) query.isVisible = filters.isVisible;
    
    // Фильтр по оценке
    if (filters.minRating || filters.maxRating) {
      query.rating = {};
      if (filters.minRating) query.rating.$gte = filters.minRating;
      if (filters.maxRating) query.rating.$lte = filters.maxRating;
    }
    
    // Фильтр по дате
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Поиск по комментарию
    if (filters.search) {
      query.comment = { $regex: filters.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find(query)
        .populate('visitorId', 'email profile.username profile.fullName')
        .populate('operatorId', 'email profile.username profile.fullName')
        .populate('hiddenBy', 'email profile.username profile.fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ratingModel.countDocuments(query),
    ]);

    return { ratings, total };
  }

  async findById(id: string): Promise<OperatorRating> {
    const rating = await this.ratingModel
      .findById(id)
      .populate('visitorId', 'email profile.username profile.fullName')
      .populate('operatorId', 'email profile.username profile.fullName')
      .populate('hiddenBy', 'email profile.username profile.fullName')
      .exec();

    if (!rating) {
      throw new NotFoundException('Оценка не найдена');
    }

    return rating;
  }

  async getOperatorRatings(operatorId: string, queryDto: GetOperatorRatingsDto): Promise<{
    ratings: OperatorRating[];
    averageRating: number;
    totalRatings: number;
    ratingBreakdown: { [key: number]: number };
    detailedAverages?: any;
  }> {
    const { limit = 10 } = queryDto;
    
    const query = {
      operatorId: new Types.ObjectId(operatorId),
      isVisible: true,
    };

    const [ratings, stats] = await Promise.all([
      this.ratingModel
        .find(query)
        .populate('visitorId', 'email profile.username profile.fullName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec(),
      this.calculateOperatorStats(operatorId),
    ]);

    return {
      ratings,
      ...stats,
    };
  }

  async calculateOperatorStats(operatorId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingBreakdown: { [key: number]: number };
    detailedAverages?: any;
  }> {
    const query = {
      operatorId: new Types.ObjectId(operatorId),
      isVisible: true,
    };

    const [avgResult, breakdown, total, detailedAvg] = await Promise.all([
      this.ratingModel.aggregate([
        { $match: query },
        { $group: { _id: null, averageRating: { $avg: '$rating' } } },
      ]),
      this.ratingModel.aggregate([
        { $match: query },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      this.ratingModel.countDocuments(query),
      this.ratingModel.aggregate([
        { $match: { ...query, detailedRating: { $exists: true } } },
        {
          $group: {
            _id: null,
            avgProfessionalism: { $avg: '$detailedRating.professionalism' },
            avgResponseTime: { $avg: '$detailedRating.responseTime' },
            avgHelpfulness: { $avg: '$detailedRating.helpfulness' },
            avgCommunication: { $avg: '$detailedRating.communication' },
            avgProblemResolution: { $avg: '$detailedRating.problemResolution' },
          },
        },
      ]),
    ]);

    const ratingBreakdown: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      ratingBreakdown[i] = 0;
    }
    breakdown.forEach(item => {
      ratingBreakdown[item._id] = item.count;
    });

    return {
      averageRating: avgResult[0]?.averageRating || 0,
      totalRatings: total,
      ratingBreakdown,
      detailedAverages: detailedAvg[0] || null,
    };
  }

  async hideRating(id: string, hideDto: HideRatingDto, hiddenById: string): Promise<OperatorRating> {
    const rating = await this.findById(id);
    
    const updatedRating = await this.ratingModel.findByIdAndUpdate(
      id,
      {
        isVisible: false,
        hiddenBy: new Types.ObjectId(hiddenById),
        hiddenReason: hideDto.hiddenReason,
        hiddenAt: new Date(),
      },
      { new: true }
    ).populate(['visitorId', 'operatorId', 'hiddenBy']);

    return updatedRating!;
  }

  async updateVisibility(id: string, updateDto: UpdateRatingVisibilityDto, updatedById: string): Promise<OperatorRating> {
    const updateData: any = {
      isVisible: updateDto.isVisible,
    };

    if (!updateDto.isVisible) {
      updateData.hiddenBy = new Types.ObjectId(updatedById);
      updateData.hiddenReason = updateDto.hiddenReason;
      updateData.hiddenAt = new Date();
    } else {
      updateData.$unset = {
        hiddenBy: 1,
        hiddenReason: 1,
        hiddenAt: 1,
      };
    }

    const updatedRating = await this.ratingModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate(['visitorId', 'operatorId', 'hiddenBy']);

    if (!updatedRating) {
      throw new NotFoundException('Оценка не найдена');
    }

    return updatedRating;
  }

  async deleteRating(id: string): Promise<void> {
    const rating = await this.findById(id);
    await this.ratingModel.findByIdAndDelete(id);
  }

  async getRatingStats(): Promise<any> {
    const overallStats = await this.ratingModel.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
        },
      },
    ]);

    const ratingDistribution = await this.ratingModel.aggregate([
      { $match: { isVisible: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const topOperators = await this.ratingModel.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: '$operatorId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
      { $match: { totalRatings: { $gte: 5 } } }, // Минимум 5 оценок
      { $sort: { averageRating: -1 } },
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

    return {
      overall: overallStats[0] || {
        totalRatings: 0,
        averageRating: 0,
        minRating: 0,
        maxRating: 0,
      },
      distribution: ratingDistribution,
      topOperators,
    };
  }

  async getVisitorRatings(visitorId: string): Promise<OperatorRating[]> {
    return this.ratingModel
      .find({ visitorId: new Types.ObjectId(visitorId) })
      .populate('operatorId', 'email profile.username profile.fullName')
      .sort({ createdAt: -1 })
      .exec();
  }
}
