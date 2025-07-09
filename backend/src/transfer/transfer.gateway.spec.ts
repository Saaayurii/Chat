import { Test, TestingModule } from '@nestjs/testing';
import { TransferGateway } from './transfer.gateway';
import { Server } from 'socket.io';

describe('TransferGateway', () => {
  let gateway: TransferGateway;
  let server: Server;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferGateway],
    }).compile();

    gateway = module.get<TransferGateway>(TransferGateway);
    server = mockServer as any;
    gateway.server = server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyTransferRequest', () => {
    it('should emit transfer request notification', () => {
      const transferData = {
        transferId: '507f1f77bcf86cd799439011',
        fromOperator: '507f1f77bcf86cd799439012',
        toOperator: '507f1f77bcf86cd799439013',
        visitor: '507f1f77bcf86cd799439014',
        chatId: '507f1f77bcf86cd799439015',
        reason: 'Test reason',
      };

      gateway.notifyTransferRequest(transferData);

      expect(server.to).toHaveBeenCalledWith(`operator_${transferData.toOperator}`);
      expect(server.emit).toHaveBeenCalledWith('transfer_request', transferData);
    });
  });

  describe('notifyTransferResponse', () => {
    it('should emit transfer response notification', () => {
      const responseData = {
        transferId: '507f1f77bcf86cd799439011',
        accepted: true,
        reason: 'Accepted',
        chatId: '507f1f77bcf86cd799439012',
        fromOperator: '507f1f77bcf86cd799439013',
        toOperator: '507f1f77bcf86cd799439014',
      };

      gateway.notifyTransferResponse(responseData);

      expect(server.to).toHaveBeenCalledWith(`operator_${responseData.fromOperator}`);
      expect(server.emit).toHaveBeenCalledWith('transfer_response', responseData);
    });
  });

  describe('notifyTransferCompleted', () => {
    it('should emit transfer completed notification', () => {
      const completedData = {
        transferId: '507f1f77bcf86cd799439011',
        newOperator: '507f1f77bcf86cd799439012',
        chatId: '507f1f77bcf86cd799439013',
      };

      gateway.notifyTransferCompleted(completedData);

      expect(server.to).toHaveBeenCalledWith(`chat_${completedData.chatId}`);
      expect(server.emit).toHaveBeenCalledWith('transfer_completed', completedData);
    });
  });

  describe('notifyQueueAdded', () => {
    it('should emit queue added notification', () => {
      const queueData = {
        queueId: '507f1f77bcf86cd799439011',
        position: 1,
        estimatedWait: 300,
      };

      gateway.notifyQueueAdded(queueData);

      expect(server.emit).toHaveBeenCalledWith('queue_added', queueData);
    });
  });

  describe('notifyQueueAssigned', () => {
    it('should emit queue assigned notification', () => {
      const assignmentData = {
        queueId: '507f1f77bcf86cd799439011',
        operatorId: '507f1f77bcf86cd799439012',
        chatId: '507f1f77bcf86cd799439013',
        visitorId: '507f1f77bcf86cd799439014',
      };

      gateway.notifyQueueAssigned(assignmentData);

      expect(server.to).toHaveBeenCalledWith(`operator_${assignmentData.operatorId}`);
      expect(server.emit).toHaveBeenCalledWith('queue_assigned', assignmentData);
    });
  });

  describe('notifyOperatorAssignment', () => {
    it('should emit operator assignment notification', () => {
      const assignmentData = {
        operatorId: '507f1f77bcf86cd799439011',
        chatId: '507f1f77bcf86cd799439012',
        visitorId: '507f1f77bcf86cd799439013',
        assignmentType: 'direct',
        priority: 0,
      };

      gateway.notifyOperatorAssignment(assignmentData);

      expect(server.to).toHaveBeenCalledWith(`operator_${assignmentData.operatorId}`);
      expect(server.emit).toHaveBeenCalledWith('operator_assignment', assignmentData);
    });
  });

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      const mockClient = {
        id: 'client-123',
        emit: jest.fn(),
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockClient as any);

      expect(consoleSpy).toHaveBeenCalledWith('Client connected:', mockClient.id);
      expect(mockClient.emit).toHaveBeenCalledWith('connection', 'Successfully connected to transfer server');

      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnect', () => {
      const mockClient = {
        id: 'client-123',
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(mockClient as any);

      expect(consoleSpy).toHaveBeenCalledWith('Client disconnected:', mockClient.id);

      consoleSpy.mockRestore();
    });
  });
});