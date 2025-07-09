import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { TransferService } from './transfer.service';
import { TransferGateway } from './transfer.gateway';
import { Transfer } from './schemas/transfer.schema';
import { Queue } from './schemas/queue.schema';
import { TransferStatus } from './enums/transfer-status.enum';
import { AssignmentStatus } from './enums/assignment-status.enum';

describe('TransferService', () => {
  let service: TransferService;
  let transferModel: Model<Transfer>;
  let queueModel: Model<Queue>;
  let transferGateway: TransferGateway;

  const mockTransferModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
  };

  const mockQueueModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
  };

  const mockTransferGateway = {
    notifyTransferRequest: jest.fn(),
    notifyTransferResponse: jest.fn(),
    notifyTransferCompleted: jest.fn(),
    notifyQueueAdded: jest.fn(),
    notifyQueueAssigned: jest.fn(),
    notifyOperatorAssignment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: getModelToken(Transfer.name),
          useValue: mockTransferModel,
        },
        {
          provide: getModelToken(Queue.name),
          useValue: mockQueueModel,
        },
        {
          provide: TransferGateway,
          useValue: mockTransferGateway,
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    transferModel = module.get<Model<Transfer>>(getModelToken(Transfer.name));
    queueModel = module.get<Model<Queue>>(getModelToken(Queue.name));
    transferGateway = module.get<TransferGateway>(TransferGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestTransfer', () => {
    const transferData = {
      fromOperatorId: '507f1f77bcf86cd799439011',
      toOperatorId: '507f1f77bcf86cd799439012',
      chatId: '507f1f77bcf86cd799439013',
      visitorId: '507f1f77bcf86cd799439014',
      reason: 'Test reason',
      note: 'Test note',
    };

    it('should throw BadRequestException when transferring to self', async () => {
      const sameOperatorData = {
        ...transferData,
        toOperatorId: transferData.fromOperatorId,
      };

      await expect(service.requestTransfer(sameOperatorData)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when active transfer exists', async () => {
      mockTransferModel.findOne.mockResolvedValue({ _id: 'existing-transfer' });

      await expect(service.requestTransfer(transferData)).rejects.toThrow(ConflictException);
    });

    it('should create and return new transfer', async () => {
      const mockTransfer = {
        _id: new Types.ObjectId(),
        ...transferData,
        status: TransferStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          ...transferData,
          status: TransferStatus.PENDING,
        }),
      };

      mockTransferModel.findOne.mockResolvedValue(null);
      mockTransferModel.new = jest.fn().mockReturnValue(mockTransfer);
      mockTransferModel.constructor = jest.fn().mockReturnValue(mockTransfer);

      const result = await service.requestTransfer(transferData);

      expect(mockTransferModel.findOne).toHaveBeenCalledWith({
        chatId: new Types.ObjectId(transferData.chatId),
        status: { $in: [TransferStatus.PENDING, TransferStatus.ACCEPTED] },
      });
      expect(mockTransferGateway.notifyTransferRequest).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('respondToTransfer', () => {
    const responseData = {
      transferId: '507f1f77bcf86cd799439011',
      accepted: true,
      reason: 'Accepted',
    };

    it('should throw NotFoundException when transfer not found', async () => {
      mockTransferModel.findById.mockResolvedValue(null);

      await expect(service.respondToTransfer(responseData)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transfer already processed', async () => {
      const mockTransfer = {
        status: TransferStatus.COMPLETED,
      };
      mockTransferModel.findById.mockResolvedValue(mockTransfer);

      await expect(service.respondToTransfer(responseData)).rejects.toThrow(BadRequestException);
    });

    it('should accept transfer and complete it', async () => {
      const mockTransfer = {
        _id: new Types.ObjectId(),
        status: TransferStatus.PENDING,
        fromOperatorId: new Types.ObjectId(),
        toOperatorId: new Types.ObjectId(),
        chatId: new Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          status: TransferStatus.COMPLETED,
        }),
      };

      mockTransferModel.findById.mockResolvedValue(mockTransfer);

      const result = await service.respondToTransfer(responseData);

      expect(mockTransfer.status).toBe(TransferStatus.COMPLETED);
      expect(mockTransferGateway.notifyTransferResponse).toHaveBeenCalled();
      expect(mockTransferGateway.notifyTransferCompleted).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should reject transfer', async () => {
      const mockTransfer = {
        _id: new Types.ObjectId(),
        status: TransferStatus.PENDING,
        fromOperatorId: new Types.ObjectId(),
        toOperatorId: new Types.ObjectId(),
        chatId: new Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          status: TransferStatus.REJECTED,
        }),
      };

      mockTransferModel.findById.mockResolvedValue(mockTransfer);

      const rejectData = { ...responseData, accepted: false };
      const result = await service.respondToTransfer(rejectData);

      expect(mockTransfer.status).toBe(TransferStatus.REJECTED);
      expect(mockTransferGateway.notifyTransferResponse).toHaveBeenCalled();
      expect(mockTransferGateway.notifyTransferCompleted).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('addToQueue', () => {
    const queueData = {
      visitorId: '507f1f77bcf86cd799439011',
      chatId: '507f1f77bcf86cd799439012',
      priority: 1,
      tags: ['urgent'],
    };

    it('should throw ConflictException when visitor already in queue', async () => {
      mockQueueModel.findOne.mockResolvedValue({ _id: 'existing-queue-entry' });

      await expect(service.addToQueue(queueData)).rejects.toThrow(ConflictException);
    });

    it('should add visitor to queue', async () => {
      const mockQueueEntry = {
        _id: new Types.ObjectId(),
        ...queueData,
        status: AssignmentStatus.QUEUED,
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          ...queueData,
          status: AssignmentStatus.QUEUED,
        }),
      };

      mockQueueModel.findOne.mockResolvedValue(null);
      mockQueueModel.new = jest.fn().mockReturnValue(mockQueueEntry);
      mockQueueModel.constructor = jest.fn().mockReturnValue(mockQueueEntry);
      mockQueueModel.countDocuments.mockResolvedValue(5);

      jest.spyOn(service, 'getQueuePosition').mockResolvedValue({
        queueId: mockQueueEntry._id.toString(),
        position: 1,
        estimatedWait: 300,
        totalInQueue: 5,
      });

      const result = await service.addToQueue(queueData);

      expect(mockQueueModel.findOne).toHaveBeenCalledWith({
        visitorId: new Types.ObjectId(queueData.visitorId),
        status: { $in: [AssignmentStatus.QUEUED, AssignmentStatus.ASSIGNED] },
      });
      expect(mockTransferGateway.notifyQueueAdded).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getQueuePosition', () => {
    const queueId = '507f1f77bcf86cd799439011';

    it('should throw NotFoundException when queue entry not found', async () => {
      mockQueueModel.findById.mockResolvedValue(null);

      await expect(service.getQueuePosition(queueId)).rejects.toThrow(NotFoundException);
    });

    it('should return queue position information', async () => {
      const mockQueueEntry = {
        _id: new Types.ObjectId(queueId),
        priority: 1,
        queuedAt: new Date(),
      };

      mockQueueModel.findById.mockResolvedValue(mockQueueEntry);
      mockQueueModel.countDocuments.mockResolvedValueOnce(2).mockResolvedValueOnce(10);

      const result = await service.getQueuePosition(queueId);

      expect(result).toEqual({
        queueId,
        position: 3,
        estimatedWait: 900,
        totalInQueue: 10,
      });
    });
  });

  describe('assignFromQueue', () => {
    const operatorId = '507f1f77bcf86cd799439011';

    it('should return null when queue is empty', async () => {
      mockQueueModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const result = await service.assignFromQueue(operatorId);

      expect(result).toBeNull();
    });

    it('should assign next visitor from queue', async () => {
      const mockQueueEntry = {
        _id: new Types.ObjectId(),
        visitorId: new Types.ObjectId(),
        chatId: new Types.ObjectId(),
        status: AssignmentStatus.QUEUED,
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          status: AssignmentStatus.ASSIGNED,
        }),
      };

      mockQueueModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockQueueEntry),
      });

      const result = await service.assignFromQueue(operatorId);

      expect(mockQueueEntry.status).toBe(AssignmentStatus.ASSIGNED);
      expect(mockTransferGateway.notifyQueueAssigned).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('autoAssignOperator', () => {
    const assignmentData = {
      visitorId: '507f1f77bcf86cd799439011',
      chatId: '507f1f77bcf86cd799439012',
      tags: ['support'],
      excludeOperators: [],
    };

    it('should add to queue when no operators available', async () => {
      jest.spyOn(service as any, 'getAvailableOperators').mockResolvedValue([]);
      jest.spyOn(service, 'addToQueue').mockResolvedValue({} as any);

      const result = await service.autoAssignOperator(assignmentData);

      expect(result).toBeNull();
      expect(service.addToQueue).toHaveBeenCalledWith({
        visitorId: assignmentData.visitorId,
        chatId: assignmentData.chatId,
        tags: assignmentData.tags,
      });
    });

    it('should assign operator when available', async () => {
      const mockOperator = {
        id: '507f1f77bcf86cd799439013',
        activeChats: 2,
      };

      jest.spyOn(service as any, 'getAvailableOperators').mockResolvedValue([mockOperator]);
      jest.spyOn(service as any, 'selectBestOperator').mockReturnValue(mockOperator);

      const result = await service.autoAssignOperator(assignmentData);

      expect(result).toEqual({
        operatorId: mockOperator.id,
        chatId: assignmentData.chatId,
        visitorId: assignmentData.visitorId,
        assignmentType: 'direct',
        priority: 0,
      });
      expect(mockTransferGateway.notifyOperatorAssignment).toHaveBeenCalled();
    });
  });

  describe('getTransferHistory', () => {
    const operatorId = '507f1f77bcf86cd799439011';

    it('should return transfer history for operator', async () => {
      const mockTransfers = [
        { _id: new Types.ObjectId(), status: TransferStatus.COMPLETED },
        { _id: new Types.ObjectId(), status: TransferStatus.REJECTED },
      ];

      mockTransferModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue(mockTransfers),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTransferHistory(operatorId);

      expect(result).toEqual(mockTransfers);
      expect(mockTransferModel.find).toHaveBeenCalledWith({
        $or: [
          { fromOperatorId: new Types.ObjectId(operatorId) },
          { toOperatorId: new Types.ObjectId(operatorId) },
        ],
      });
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueueModel.countDocuments.mockResolvedValue(5);
      mockQueueModel.aggregate.mockResolvedValue([{ avgWaitTime: 450 }]);

      const result = await service.getQueueStats();

      expect(result).toEqual({
        totalInQueue: 5,
        averageWaitTime: 450,
      });
    });

    it('should return default wait time when no data', async () => {
      mockQueueModel.countDocuments.mockResolvedValue(0);
      mockQueueModel.aggregate.mockResolvedValue([]);

      const result = await service.getQueueStats();

      expect(result).toEqual({
        totalInQueue: 0,
        averageWaitTime: 0,
      });
    });
  });

  describe('cancelTransfer', () => {
    const transferId = '507f1f77bcf86cd799439011';

    it('should throw NotFoundException when transfer not found', async () => {
      mockTransferModel.findById.mockResolvedValue(null);

      await expect(service.cancelTransfer(transferId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transfer is not pending', async () => {
      const mockTransfer = {
        status: TransferStatus.COMPLETED,
      };
      mockTransferModel.findById.mockResolvedValue(mockTransfer);

      await expect(service.cancelTransfer(transferId)).rejects.toThrow(BadRequestException);
    });

    it('should cancel pending transfer', async () => {
      const mockTransfer = {
        status: TransferStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          status: TransferStatus.CANCELLED,
        }),
      };
      mockTransferModel.findById.mockResolvedValue(mockTransfer);

      const result = await service.cancelTransfer(transferId);

      expect(mockTransfer.status).toBe(TransferStatus.CANCELLED);
      expect(result).toBeDefined();
    });
  });

  describe('removeFromQueue', () => {
    const queueId = '507f1f77bcf86cd799439011';

    it('should throw NotFoundException when queue entry not found', async () => {
      mockQueueModel.findById.mockResolvedValue(null);

      await expect(service.removeFromQueue(queueId)).rejects.toThrow(NotFoundException);
    });

    it('should remove entry from queue', async () => {
      const mockQueueEntry = {
        status: AssignmentStatus.QUEUED,
        save: jest.fn().mockResolvedValue({
          status: AssignmentStatus.CANCELLED,
        }),
      };
      mockQueueModel.findById.mockResolvedValue(mockQueueEntry);

      await service.removeFromQueue(queueId);

      expect(mockQueueEntry.status).toBe(AssignmentStatus.CANCELLED);
      expect(mockQueueEntry.save).toHaveBeenCalled();
    });
  });
});