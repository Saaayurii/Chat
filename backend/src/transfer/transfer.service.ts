import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transfer } from './schemas/transfer.schema';
import { Queue } from './schemas/queue.schema';
import { Conversation } from '../database/schemas/conversation.schema';
import { TransferStatus } from './enums/transfer-status.enum';
import { AssignmentStatus } from './enums/assignment-status.enum';
import { TransferChatDto } from './dto/transfer-chat.dto';
import { AcceptTransferDto } from './dto/accept-transfer.dto';
import { AddToQueueDto, QueuePositionDto } from './dto/queue-position.dto';
import { OperatorAssignmentDto, AutoAssignDto } from './dto/operator-assignment.dto';
import { TransferGateway } from './transfer.gateway';

@Injectable()
export class TransferService {
  constructor(
    @InjectModel(Transfer.name) private transferModel: Model<Transfer>,
    @InjectModel(Queue.name) private queueModel: Model<Queue>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    private transferGateway: TransferGateway,
  ) {}

  async requestTransfer(transferData: TransferChatDto): Promise<Transfer> {
    const { chatId, toOperatorId, fromOperatorId } = transferData;

    // Находим беседу и получаем текущего оператора
    const conversation = await this.conversationModel.findById(chatId);
    if (!conversation) {
      throw new NotFoundException('Беседа не найдена');
    }

    const currentOperatorId = fromOperatorId || conversation.assignedOperator;
    if (!currentOperatorId) {
      throw new BadRequestException('У беседы нет назначенного оператора');
    }

    // Проверяем, что оператор может передавать только свои беседы
    if (fromOperatorId && conversation.assignedOperator?.toString() !== fromOperatorId) {
      throw new ForbiddenException('Вы можете передавать только назначенные вам беседы');
    }

    if (currentOperatorId.toString() === toOperatorId) {
      throw new BadRequestException('Нельзя передать чат самому себе');
    }

    const existingActiveTransfer = await this.transferModel.findOne({
      chatId: new Types.ObjectId(chatId),
      status: { $in: [TransferStatus.PENDING, TransferStatus.ACCEPTED] }
    });

    if (existingActiveTransfer) {
      throw new ConflictException('Для этого чата уже существует активная передача');
    }

    // Получаем visitorId из беседы
    let visitorId = conversation.createdBy;
    if (transferData.visitorId) {
      visitorId = new Types.ObjectId(transferData.visitorId);
    }
    // Если это анонимная беседа без createdBy, создаем временный ID
    if (!visitorId) {
      visitorId = new Types.ObjectId(); // Временный ID для анонимных пользователей
    }

    const transfer = new this.transferModel({
      fromOperatorId: new Types.ObjectId(currentOperatorId),
      toOperatorId: new Types.ObjectId(toOperatorId),
      chatId: new Types.ObjectId(chatId),
      visitorId: visitorId,
      status: TransferStatus.PENDING,
      reason: transferData.reason,
      note: transferData.note,
      requestedAt: new Date(),
    });

    const savedTransfer = await transfer.save();

    // Немедленно переносим беседу к новому оператору
    await this.conversationModel.findByIdAndUpdate(chatId, {
      assignedOperator: new Types.ObjectId(toOperatorId)
    });

    // Уведомляем операторов о переносе беседы
    this.transferGateway.notifyConversationTransferred({
      conversationId: chatId,
      fromOperatorId: (fromOperatorId || currentOperatorId).toString(),
      toOperatorId: toOperatorId
    });

    // Уведомляем операторов о запросе переноса
    this.transferGateway.notifyTransferRequest({
      transferId: (savedTransfer._id as Types.ObjectId).toString(),
      fromOperator: fromOperatorId || currentOperatorId.toString(),
      toOperator: toOperatorId,
      visitor: visitorId.toString(),
      chatId,
      reason: transferData.reason,
    });

    // Автоматически принимаем перенос (т.к. он сразу активируется)
    savedTransfer.status = TransferStatus.ACCEPTED;
    savedTransfer.respondedAt = new Date();
    savedTransfer.completedAt = new Date();
    await savedTransfer.save();

    return savedTransfer;
  }

  async respondToTransfer(responseData: AcceptTransferDto): Promise<Transfer> {
    const { transferId, accepted, reason } = responseData;

    const transfer = await this.transferModel.findById(transferId);
    if (!transfer) {
      throw new NotFoundException('Запрос на передачу не найден');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Запрос на передачу уже обработан');
    }

    transfer.status = accepted ? TransferStatus.ACCEPTED : TransferStatus.REJECTED;
    transfer.respondedAt = new Date();
    if (reason) transfer.reason = reason;

    if (accepted) {
      transfer.completedAt = new Date();
      transfer.status = TransferStatus.COMPLETED;
    }

    const updatedTransfer = await transfer.save();

    this.transferGateway.notifyTransferResponse({
      transferId: (transfer._id as Types.ObjectId).toString(),
      accepted,
      reason,
      chatId: transfer.chatId.toString(),
      fromOperator: transfer.fromOperatorId.toString(),
      toOperator: transfer.toOperatorId.toString(),
    });

    if (accepted) {
      // Обновляем назначенного оператора в беседе
      await this.conversationModel.findByIdAndUpdate(transfer.chatId, {
        assignedOperator: transfer.toOperatorId,
        transferredFrom: transfer.fromOperatorId,
        transferredTo: transfer.toOperatorId,
        transferReason: transfer.reason
      });

      this.transferGateway.notifyTransferCompleted({
        transferId: (transfer._id as Types.ObjectId).toString(),
        newOperator: transfer.toOperatorId.toString(),
        chatId: transfer.chatId.toString(),
      });
    }

    return updatedTransfer;
  }

  async addToQueue(queueData: AddToQueueDto): Promise<Queue> {
    const { visitorId, chatId, priority = 0, tags = [] } = queueData;

    const existingQueueEntry = await this.queueModel.findOne({
      visitorId: new Types.ObjectId(visitorId),
      status: { $in: [AssignmentStatus.QUEUED, AssignmentStatus.ASSIGNED] }
    });

    if (existingQueueEntry) {
      throw new ConflictException('Посетитель уже в очереди');
    }

    const queueEntry = new this.queueModel({
      visitorId: new Types.ObjectId(visitorId),
      chatId: new Types.ObjectId(chatId),
      priority,
      tags,
      status: AssignmentStatus.QUEUED,
      queuedAt: new Date(),
    });

    const savedQueueEntry = await queueEntry.save();
    const position = await this.getQueuePosition((savedQueueEntry._id as Types.ObjectId).toString());

    this.transferGateway.notifyQueueAdded({
      queueId: (savedQueueEntry._id as Types.ObjectId).toString(),
      position: position.position,
      estimatedWait: position.estimatedWait,
    });

    return savedQueueEntry;
  }

  async getQueuePosition(queueId: string): Promise<QueuePositionDto> {
    const queueEntry = await this.queueModel.findById(queueId);
    if (!queueEntry) {
      throw new NotFoundException('Запись в очереди не найдена');
    }

    const position = await this.queueModel.countDocuments({
      status: AssignmentStatus.QUEUED,
      $or: [
        { priority: { $gt: queueEntry.priority } },
        { 
          priority: queueEntry.priority,
          queuedAt: { $lt: queueEntry.queuedAt }
        }
      ]
    }) + 1;

    const totalInQueue = await this.queueModel.countDocuments({
      status: AssignmentStatus.QUEUED
    });

    const estimatedWait = position * 300; // 5 минут на человека

    return {
      queueId,
      position,
      estimatedWait,
      totalInQueue,
    };
  }

  async assignFromQueue(operatorId: string): Promise<Queue | null> {
    const nextInQueue = await this.queueModel.findOne({
      status: AssignmentStatus.QUEUED
    }).sort({ priority: -1, queuedAt: 1 });

    if (!nextInQueue) {
      return null;
    }

    nextInQueue.status = AssignmentStatus.ASSIGNED;
    nextInQueue.assignedOperatorId = new Types.ObjectId(operatorId);
    nextInQueue.assignedAt = new Date();

    const assignedEntry = await nextInQueue.save();

    this.transferGateway.notifyQueueAssigned({
      queueId: (assignedEntry._id as Types.ObjectId).toString(),
      operatorId,
      chatId: assignedEntry.chatId.toString(),
      visitorId: assignedEntry.visitorId.toString(),
    });

    return assignedEntry;
  }

  async autoAssignOperator(assignmentData: AutoAssignDto): Promise<OperatorAssignmentDto | null> {
    const { visitorId, chatId, tags = [], excludeOperators = [] } = assignmentData;

    const availableOperators = await this.getAvailableOperators(excludeOperators, tags);
    
    if (availableOperators.length === 0) {
      await this.addToQueue({ visitorId, chatId, tags });
      return null;
    }

    const selectedOperator = this.selectBestOperator(availableOperators);

    const assignment: OperatorAssignmentDto = {
      operatorId: selectedOperator.id,
      chatId,
      visitorId,
      assignmentType: 'direct',
      priority: 0,
    };

    this.transferGateway.notifyOperatorAssignment(assignment);

    return assignment;
  }

  private async getAvailableOperators(excludeIds: string[], tags: string[] = []): Promise<any[]> {
    const query: any = {
      role: 'operator',
      isActive: true,
      _id: { $nin: excludeIds.map(id => new Types.ObjectId(id)) }
    };

    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    return []; // Здесь должен быть запрос к модели пользователей
  }

  private selectBestOperator(operators: any[]): any {
    return operators.reduce((best, current) => {
      if (current.activeChats < best.activeChats) {
        return current;
      }
      return best;
    });
  }

  async getPendingTransfers(operatorId: string): Promise<any[]> {
    const transfers = await this.transferModel
      .find({
        toOperatorId: new Types.ObjectId(operatorId),
        status: TransferStatus.PENDING
      })
      .sort({ requestedAt: -1 })
      .populate('fromOperatorId', 'name email avatar')
      .populate('visitorId', 'name email avatar')
      .exec();

    // Трансформируем данные для frontend
    return transfers.map(transfer => {
      const transferObj = transfer.toObject();
      return {
        id: (transferObj._id as any).toString(),
        fromOperator: {
          id: (transferObj.fromOperatorId as any)._id?.toString() || transferObj.fromOperatorId.toString(),
          name: (transferObj.fromOperatorId as any).name || 'Unknown Operator',
          avatar: (transferObj.fromOperatorId as any).avatar
        },
        visitor: {
          id: (transferObj.visitorId as any)._id?.toString() || transferObj.visitorId.toString(),
          name: (transferObj.visitorId as any).name || 'Unknown Visitor',
          email: (transferObj.visitorId as any).email || 'No email',
          avatar: (transferObj.visitorId as any).avatar
        },
        conversationId: transferObj.chatId.toString(),
        reason: transferObj.reason,
        timestamp: transferObj.requestedAt.toISOString()
      };
    });
  }

  async getTransferHistory(operatorId: string, limit: number = 10): Promise<Transfer[]> {
    return this.transferModel
      .find({
        $or: [
          { fromOperatorId: new Types.ObjectId(operatorId) },
          { toOperatorId: new Types.ObjectId(operatorId) }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('fromOperatorId', 'name email')
      .populate('toOperatorId', 'name email')
      .populate('visitorId', 'name email')
      .exec();
  }

  async getQueueStats(): Promise<any> {
    const totalInQueue = await this.queueModel.countDocuments({
      status: AssignmentStatus.QUEUED
    });

    const averageWaitTime = await this.queueModel.aggregate([
      {
        $match: {
          status: AssignmentStatus.ASSIGNED,
          assignedAt: { $exists: true }
        }
      },
      {
        $addFields: {
          waitTime: { $subtract: ['$assignedAt', '$queuedAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgWaitTime: { $avg: '$waitTime' }
        }
      }
    ]);

    return {
      totalInQueue,
      averageWaitTime: averageWaitTime[0]?.avgWaitTime || 0,
    };
  }

  async cancelTransfer(transferId: string): Promise<Transfer> {
    const transfer = await this.transferModel.findById(transferId);
    if (!transfer) {
      throw new NotFoundException('Запрос на передачу не найден');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Можно отменить только ожидающие запросы');
    }

    transfer.status = TransferStatus.CANCELLED;
    return transfer.save();
  }

  async removeFromQueue(queueId: string): Promise<void> {
    const queueEntry = await this.queueModel.findById(queueId);
    if (!queueEntry) {
      throw new NotFoundException('Запись в очереди не найдена');
    }

    queueEntry.status = AssignmentStatus.CANCELLED;
    await queueEntry.save();
  }
}