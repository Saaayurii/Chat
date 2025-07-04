import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';

interface TransferRequestData {
  transferId: string;
  fromOperator: string;
  toOperator: string;
  visitor: string;
  chatId: string;
  reason?: string;
}

interface TransferResponseData {
  transferId: string;
  accepted: boolean;
  reason?: string;
  chatId: string;
  fromOperator: string;
  toOperator: string;
}

interface TransferCompletedData {
  transferId: string;
  newOperator: string;
  chatId: string;
}

interface QueueAddedData {
  queueId: string;
  position: number;
  estimatedWait: number;
}

interface QueueAssignedData {
  queueId: string;
  operatorId: string;
  chatId: string;
  visitorId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/transfer',
})
export class TransferGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TransferGateway');
  private connectedOperators: Map<string, string> = new Map(); // socketId -> operatorId

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedOperators.delete(client.id);
  }

  @SubscribeMessage('join')
  @UseGuards(WsAuthGuard)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { operatorId: string }
  ) {
    const { operatorId } = data;
    this.connectedOperators.set(client.id, operatorId);
    client.join(`operator:${operatorId}`);
    this.logger.log(`Operator ${operatorId} joined transfer room`);
    
    client.emit('joined', {
      success: true,
      operatorId,
      message: 'Подключен к системе перенаправлений'
    });
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    const operatorId = this.connectedOperators.get(client.id);
    if (operatorId) {
      client.leave(`operator:${operatorId}`);
      this.connectedOperators.delete(client.id);
      this.logger.log(`Operator ${operatorId} left transfer room`);
    }
  }

  notifyTransferRequest(data: TransferRequestData) {
    this.server.to(`operator:${data.toOperator}`).emit('transfer:request', {
      transferId: data.transferId,
      fromOperator: data.fromOperator,
      toOperator: data.toOperator,
      visitor: data.visitor,
      chatId: data.chatId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Transfer request sent to operator ${data.toOperator}`);
  }

  notifyTransferResponse(data: TransferResponseData) {
    this.server.to(`operator:${data.fromOperator}`).emit('transfer:response', {
      transferId: data.transferId,
      accepted: data.accepted,
      reason: data.reason,
      chatId: data.chatId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Transfer response sent to operator ${data.fromOperator}`);
  }

  notifyTransferCompleted(data: TransferCompletedData) {
    this.server.to(`operator:${data.newOperator}`).emit('transfer:completed', {
      transferId: data.transferId,
      newOperator: data.newOperator,
      chatId: data.chatId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Transfer completed notification sent to operator ${data.newOperator}`);
  }

  notifyQueueAdded(data: QueueAddedData) {
    this.server.emit('queue:added', {
      queueId: data.queueId,
      position: data.position,
      estimatedWait: data.estimatedWait,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Queue added notification sent to all operators`);
  }

  notifyQueueAssigned(data: QueueAssignedData) {
    this.server.to(`operator:${data.operatorId}`).emit('queue:assigned', {
      queueId: data.queueId,
      operatorId: data.operatorId,
      chatId: data.chatId,
      visitorId: data.visitorId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Queue assignment sent to operator ${data.operatorId}`);
  }

  notifyOperatorAssignment(data: any) {
    this.server.to(`operator:${data.operatorId}`).emit('operator:assignment', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Operator assignment sent to operator ${data.operatorId}`);
  }

  @SubscribeMessage('transfer:accept')
  @UseGuards(WsAuthGuard)
  handleAcceptTransfer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { transferId: string; accepted: boolean; reason?: string }
  ) {
    const operatorId = this.connectedOperators.get(client.id);
    if (!operatorId) {
      client.emit('error', { message: 'Оператор не авторизован' });
      return;
    }

    client.emit('transfer:accept:received', {
      transferId: data.transferId,
      accepted: data.accepted,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Transfer acceptance received from operator ${operatorId}`);
  }

  @SubscribeMessage('queue:status')
  @UseGuards(WsAuthGuard)
  handleQueueStatus(@ConnectedSocket() client: Socket) {
    const operatorId = this.connectedOperators.get(client.id);
    if (!operatorId) {
      client.emit('error', { message: 'Оператор не авторизован' });
      return;
    }

    client.emit('queue:status:update', {
      operatorId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('operator:availability')
  @UseGuards(WsAuthGuard)
  handleOperatorAvailability(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { available: boolean }
  ) {
    const operatorId = this.connectedOperators.get(client.id);
    if (!operatorId) {
      client.emit('error', { message: 'Оператор не авторизован' });
      return;
    }

    this.server.emit('operator:availability:update', {
      operatorId,
      available: data.available,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Operator ${operatorId} availability updated: ${data.available}`);
  }

  broadcastQueueUpdate(queueStats: any) {
    this.server.emit('queue:stats:update', {
      ...queueStats,
      timestamp: new Date().toISOString(),
    });
  }

  notifyOperatorWorkload(operatorId: string, workload: any) {
    this.server.to(`operator:${operatorId}`).emit('operator:workload', {
      operatorId,
      workload,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastSystemStatus(status: any) {
    this.server.emit('system:status', {
      ...status,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedOperators(): string[] {
    return Array.from(this.connectedOperators.values());
  }

  isOperatorConnected(operatorId: string): boolean {
    return Array.from(this.connectedOperators.values()).includes(operatorId);
  }
}