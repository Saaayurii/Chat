import { Test, TestingModule } from '@nestjs/testing';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { TransferPermissionGuard } from './guards/transfer-permission.guard';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { TransferStatus } from './enums/transfer-status.enum';
import { AssignmentStatus } from './enums/assignment-status.enum';
import { Types } from 'mongoose';

describe('TransferController', () => {
  let controller: TransferController;
  let service: TransferService;

  const mockTransferService = {
    requestTransfer: jest.fn(),
    respondToTransfer: jest.fn(),
    addToQueue: jest.fn(),
    getQueuePosition: jest.fn(),
    assignFromQueue: jest.fn(),
    autoAssignOperator: jest.fn(),
    getTransferHistory: jest.fn(),
    getQueueStats: jest.fn(),
    cancelTransfer: jest.fn(),
    removeFromQueue: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockTransferPermissionGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TransferService,
          useValue: mockTransferService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TransferPermissionGuard)
      .useValue(mockTransferPermissionGuard)
      .compile();

    controller = module.get<TransferController>(TransferController);
    service = module.get<TransferService>(TransferService);
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

    it('should call transferService.requestTransfer', async () => {
      const mockTransfer = {
        _id: new Types.ObjectId(),
        ...transferData,
        status: TransferStatus.PENDING,
      };

      mockTransferService.requestTransfer.mockResolvedValue(mockTransfer);

      const result = await controller.requestTransfer(transferData);

      expect(service.requestTransfer).toHaveBeenCalledWith(transferData);
      expect(result).toEqual(mockTransfer);
    });
  });

  describe('respondToTransfer', () => {
    const responseData = {
      transferId: '507f1f77bcf86cd799439011',
      accepted: true,
      reason: 'Accepted',
    };

    it('should call transferService.respondToTransfer', async () => {
      const mockTransfer = {
        _id: new Types.ObjectId(),
        status: TransferStatus.COMPLETED,
      };

      mockTransferService.respondToTransfer.mockResolvedValue(mockTransfer);

      const result = await controller.respondToTransfer(responseData);

      expect(service.respondToTransfer).toHaveBeenCalledWith(responseData);
      expect(result).toEqual(mockTransfer);
    });
  });

  describe('addToQueue', () => {
    const queueData = {
      visitorId: '507f1f77bcf86cd799439011',
      chatId: '507f1f77bcf86cd799439012',
      priority: 1,
      tags: ['urgent'],
    };

    it('should call transferService.addToQueue', async () => {
      const mockQueueEntry = {
        _id: new Types.ObjectId(),
        ...queueData,
        status: AssignmentStatus.QUEUED,
      };

      mockTransferService.addToQueue.mockResolvedValue(mockQueueEntry);

      const result = await controller.addToQueue(queueData);

      expect(service.addToQueue).toHaveBeenCalledWith(queueData);
      expect(result).toEqual(mockQueueEntry);
    });
  });

  describe('getQueuePosition', () => {
    const queueId = '507f1f77bcf86cd799439011';

    it('should call transferService.getQueuePosition', async () => {
      const mockPosition = {
        queueId,
        position: 1,
        estimatedWait: 300,
        totalInQueue: 5,
      };

      mockTransferService.getQueuePosition.mockResolvedValue(mockPosition);

      const result = await controller.getQueuePosition(queueId);

      expect(service.getQueuePosition).toHaveBeenCalledWith(queueId);
      expect(result).toEqual(mockPosition);
    });
  });

  describe('assignFromQueue', () => {
    const operatorId = '507f1f77bcf86cd799439011';

    it('should call transferService.assignFromQueue', async () => {
      const mockQueueEntry = {
        _id: new Types.ObjectId(),
        status: AssignmentStatus.ASSIGNED,
      };

      mockTransferService.assignFromQueue.mockResolvedValue(mockQueueEntry);

      const result = await controller.assignFromQueue(operatorId);

      expect(service.assignFromQueue).toHaveBeenCalledWith(operatorId);
      expect(result).toEqual(mockQueueEntry);
    });
  });

  describe('autoAssignOperator', () => {
    const assignmentData = {
      visitorId: '507f1f77bcf86cd799439011',
      chatId: '507f1f77bcf86cd799439012',
      tags: ['support'],
      excludeOperators: [],
    };

    it('should call transferService.autoAssignOperator', async () => {
      const mockAssignment = {
        operatorId: '507f1f77bcf86cd799439013',
        chatId: assignmentData.chatId,
        visitorId: assignmentData.visitorId,
        assignmentType: 'direct',
        priority: 0,
      };

      mockTransferService.autoAssignOperator.mockResolvedValue(mockAssignment);

      const result = await controller.autoAssignOperator(assignmentData);

      expect(service.autoAssignOperator).toHaveBeenCalledWith(assignmentData);
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('getTransferHistory', () => {
    const operatorId = '507f1f77bcf86cd799439011';

    it('should call transferService.getTransferHistory with default limit', async () => {
      const mockHistory = [
        { _id: new Types.ObjectId(), status: TransferStatus.COMPLETED },
        { _id: new Types.ObjectId(), status: TransferStatus.REJECTED },
      ];

      mockTransferService.getTransferHistory.mockResolvedValue(mockHistory);

      const result = await controller.getTransferHistory(operatorId);

      expect(service.getTransferHistory).toHaveBeenCalledWith(operatorId, 10);
      expect(result).toEqual(mockHistory);
    });

    it('should call transferService.getTransferHistory with custom limit', async () => {
      const mockHistory = [
        { _id: new Types.ObjectId(), status: TransferStatus.COMPLETED },
      ];

      mockTransferService.getTransferHistory.mockResolvedValue(mockHistory);

      const result = await controller.getTransferHistory(operatorId, '5');

      expect(service.getTransferHistory).toHaveBeenCalledWith(operatorId, 5);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getQueueStats', () => {
    it('should call transferService.getQueueStats', async () => {
      const mockStats = {
        totalInQueue: 5,
        averageWaitTime: 450,
      };

      mockTransferService.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(service.getQueueStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('cancelTransfer', () => {
    const transferId = '507f1f77bcf86cd799439011';

    it('should call transferService.cancelTransfer', async () => {
      const mockTransfer = {
        _id: new Types.ObjectId(),
        status: TransferStatus.CANCELLED,
      };

      mockTransferService.cancelTransfer.mockResolvedValue(mockTransfer);

      const result = await controller.cancelTransfer(transferId);

      expect(service.cancelTransfer).toHaveBeenCalledWith(transferId);
      expect(result).toEqual(mockTransfer);
    });
  });

  describe('removeFromQueue', () => {
    const queueId = '507f1f77bcf86cd799439011';

    it('should call transferService.removeFromQueue', async () => {
      mockTransferService.removeFromQueue.mockResolvedValue(undefined);

      await controller.removeFromQueue(queueId);

      expect(service.removeFromQueue).toHaveBeenCalledWith(queueId);
    });
  });
});