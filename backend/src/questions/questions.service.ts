import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Question, QuestionDocument, QuestionStatus } from '../database/schemas/question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto, AssignOperatorDto, TransferQuestionDto, CloseQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { BaseQueryFilter, UpdateData } from '../common/interfaces/query-filter.interface';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private emailService: EmailService,
    private usersService: UsersService,
    private chatService: ChatService,
  ) {}

  async createQuestion(createDto: CreateQuestionDto, visitorId: string): Promise<Question> {
    const question = new this.questionModel({
      ...createDto,
      visitorId: new Types.ObjectId(visitorId),
    });

    const savedQuestion = await question.save();
    return savedQuestion.populate('visitorId', 'email profile.username profile.fullName');
  }

  async findAll(queryDto: QueryQuestionsDto): Promise<{ questions: Question[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = queryDto;
    
    const query: BaseQueryFilter = {};
    
    // Применяем фильтры
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.visitorId) query.visitorId = new Types.ObjectId(filters.visitorId);
    if (filters.operatorId) query.operatorId = new Types.ObjectId(filters.operatorId);
    
    // Фильтр неназначенных вопросов
    if (filters.unassigned) {
      query.operatorId = { $exists: false };
      query.status = QuestionStatus.OPEN;
    }
    
    // Фильтр просроченных вопросов (более 24 часов без ответа)
    if (filters.overdue) {
      const overdueDate = new Date();
      overdueDate.setHours(overdueDate.getHours() - 24);
      query.createdAt = { $lt: overdueDate };
      query.firstResponseAt = { $exists: false };
      query.status = { $in: [QuestionStatus.OPEN, QuestionStatus.ASSIGNED, QuestionStatus.IN_PROGRESS] };
    }
    
    // Фильтр по дате
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Поиск по тексту
    if (filters.search) {
      query.text = { $regex: filters.search, $options: 'i' };
    }
    
    // Фильтр по тегам
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [questions, total] = await Promise.all([
      this.questionModel
        .find(query)
        .populate('visitorId', 'email profile.username profile.fullName')
        .populate('operatorId', 'email profile.username profile.fullName')
        .populate('closedBy', 'email profile.username profile.fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.questionModel.countDocuments(query),
    ]);

    return { questions, total };
  }

  async findById(id: string): Promise<Question> {
    const question = await this.questionModel
      .findById(id)
      .populate('visitorId', 'email profile.username profile.fullName')
      .populate('operatorId', 'email profile.username profile.fullName')
      .populate('closedBy', 'email profile.username profile.fullName')
      .exec();

    if (!question) {
      throw new NotFoundException('Вопрос не найден');
    }

    return question;
  }

  async findByUserId(userId: string): Promise<Question[]> {
    return this.questionModel
      .find({ visitorId: new Types.ObjectId(userId) })
      .populate('operatorId', 'email profile.username profile.fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async assignOperator(id: string, assignDto: AssignOperatorDto, assignedById?: string): Promise<Question> {
    const question = await this.findById(id);
    
    if (question.status !== QuestionStatus.OPEN) {
      throw new ForbiddenException('Можно назначить оператора только на открытый вопрос');
    }

    const updatedQuestion = await this.questionModel.findByIdAndUpdate(
      id,
      {
        operatorId: new Types.ObjectId(assignDto.operatorId),
        status: QuestionStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      { new: true }
    ).populate(['visitorId', 'operatorId']);

    // Отправляем уведомление посетителю
    try {
      const visitor = await this.usersService.findById(question.visitorId.toString());
      const operator = await this.usersService.findById(assignDto.operatorId);
      
      if (visitor?.email && operator) {
        await this.emailService.sendOperatorAssignedEmail(
          visitor.email,
          operator.profile?.username || operator.email,
          question.text
        );
      }
    } catch (error) {
      console.error('Failed to send operator assignment notification:', error);
    }

    return updatedQuestion!;
  }

  async transferQuestion(id: string, transferDto: TransferQuestionDto, fromOperatorId: string): Promise<Question> {
    const question = await this.findById(id);
    
    if (!question.operatorId || question.operatorId.toString() !== fromOperatorId) {
      throw new ForbiddenException('Можно передать только назначенный вам вопрос');
    }

    const transferRecord = {
      fromOperatorId: new Types.ObjectId(fromOperatorId),
      toOperatorId: new Types.ObjectId(transferDto.toOperatorId),
      reason: transferDto.reason,
      transferredAt: new Date(),
    };

    const updatedQuestion = await this.questionModel.findByIdAndUpdate(
      id,
      {
        operatorId: new Types.ObjectId(transferDto.toOperatorId),
        status: QuestionStatus.TRANSFERRED,
        $push: { transferHistory: transferRecord },
      },
      { new: true }
    ).populate(['visitorId', 'operatorId']);

    return updatedQuestion!;
  }

  async updateQuestion(id: string, updateDto: UpdateQuestionDto): Promise<Question> {
    const updateData: any = { ...updateDto };
    
    if (updateDto.conversationId) {
      updateData.conversationId = new Types.ObjectId(updateDto.conversationId);
    }

    const updatedQuestion = await this.questionModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate(['visitorId', 'operatorId', 'closedBy']);

    if (!updatedQuestion) {
      throw new NotFoundException('Вопрос не найден');
    }

    return updatedQuestion;
  }

  async closeQuestion(id: string, closeDto: CloseQuestionDto, closedById: string): Promise<Question> {
    const question = await this.findById(id);
    
    if (question.status === QuestionStatus.CLOSED) {
      throw new ForbiddenException('Вопрос уже закрыт');
    }

    const now = new Date();
    const resolutionTime = question.assignedAt 
      ? Math.floor((now.getTime() - question.assignedAt.getTime()) / (1000 * 60))
      : 0;

    const updatedQuestion = await this.questionModel.findByIdAndUpdate(
      id,
      {
        status: QuestionStatus.CLOSED,
        closedAt: now,
        closedBy: new Types.ObjectId(closedById),
        resolvedAt: now,
        resolutionTimeMinutes: resolutionTime,
        internalNotes: closeDto.closingComment,
      },
      { new: true }
    ).populate(['visitorId', 'operatorId', 'closedBy']);

    return updatedQuestion!;
  }

  async markFirstResponse(questionId: string): Promise<void> {
    const question = await this.questionModel.findById(questionId);
    
    if (question && !question.firstResponseAt) {
      const now = new Date();
      const responseTime = Math.floor((now.getTime() - question.createdAt.getTime()) / (1000 * 60));
      
      await this.questionModel.findByIdAndUpdate(questionId, {
        firstResponseAt: now,
        responseTimeMinutes: responseTime,
        status: QuestionStatus.IN_PROGRESS,
      });
    }
  }

  async incrementMessagesCount(questionId: string): Promise<void> {
    await this.questionModel.findByIdAndUpdate(questionId, {
      $inc: { messagesCount: 1 },
    });
  }

  async deleteQuestion(id: string): Promise<void> {
    const question = await this.findById(id);
    await this.questionModel.findByIdAndDelete(id);
  }

  async getQuestionStats(): Promise<any> {
    const statusStats = await this.questionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await this.questionModel.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await this.questionModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const avgResponseTime = await this.questionModel.aggregate([
      {
        $match: { responseTimeMinutes: { $gt: 0 } },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTimeMinutes' },
        },
      },
    ]);

    const avgResolutionTime = await this.questionModel.aggregate([
      {
        $match: { resolutionTimeMinutes: { $gt: 0 } },
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTimeMinutes' },
        },
      },
    ]);

    return {
      statusStats,
      priorityStats,
      categoryStats,
      avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
      avgResolutionTime: avgResolutionTime[0]?.avgResolutionTime || 0,
    };
  }

  async getOperatorWorkload(operatorId: string): Promise<any> {
    const activeQuestions = await this.questionModel.countDocuments({
      operatorId: new Types.ObjectId(operatorId),
      status: { $in: [QuestionStatus.ASSIGNED, QuestionStatus.IN_PROGRESS] },
    });

    const totalQuestions = await this.questionModel.countDocuments({
      operatorId: new Types.ObjectId(operatorId),
    });

    const closedToday = await this.questionModel.countDocuments({
      operatorId: new Types.ObjectId(operatorId),
      status: QuestionStatus.CLOSED,
      closedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });

    return {
      activeQuestions,
      totalQuestions,
      closedToday,
    };
  }
}
