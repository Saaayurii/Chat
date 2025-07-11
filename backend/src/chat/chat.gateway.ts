import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { UseGuards, ValidationPipe, UsePipes, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto/join-room.dto';
import { RedisService } from '../common/services/redis.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  // В ChatGateway и TransferGateway
async afterInit(server: Server) {
  try {
    // Проверяем доступность Redis
    const redisHealthy = await this.redisService.healthCheck();
    
    if (!redisHealthy) {
      this.logger.warn('Redis not available, using memory adapter');
      return;
    }

    const redisClient = this.redisService.getClient();
    if (!redisClient) {
      this.logger.warn('Redis client not available, using memory adapter');
      return;
    }

    // Создаем дублирующий клиент для адаптера
    const subClient = redisClient.duplicate();
    await subClient.connect();

    // Устанавливаем адаптер
    server.adapter(createAdapter(redisClient, subClient));
    
    this.logger.log('Redis adapter configured successfully');
  } catch (error) {
    this.logger.error(`Redis adapter setup failed: ${error.message}`);
    this.logger.warn('Using memory adapter - single instance mode');
  }
}

  async handleConnection(client: Socket) {
    try {
      const user = client.data.user;
      if (!user) {
        client.disconnect();
        return;
      }

      this.logger.log(`Client connected: ${user.email} (${user.id})`);
      
      // Присоединяем пользователя к его персональной комнате
      await client.join(`user:${user.id}`);
      
      // Сохраняем сессию в Redis
      await this.redisService.setSocketSession(client.id, user.id);
      
      // Отмечаем пользователя как онлайн
      await this.redisService.setUserOnline(user.id);
      
      // Уведомляем о подключении
      client.emit('connected', {
        message: 'Successfully connected to chat',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client disconnected: ${user.email} (${user.id})`);
      
      // Удаляем сессию из Redis
      await this.redisService.deleteSocketSession(client.id);
      
      // Отмечаем пользователя как оффлайн
      await this.redisService.setUserOffline(user.id);
    }
  }

  @SubscribeMessage('join-room')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinRoomDto: JoinRoomDto,
  ) {
    try {
      const user = client.data.user;
      const { conversationId } = joinRoomDto;

      // Проверяем, что пользователь может присоединиться к этой беседе
      const canJoin = await this.chatService.canUserJoinConversation(user.id, conversationId);
      
      if (!canJoin) {
        client.emit('error', { message: 'Access denied to this conversation' });
        return;
      }

      // Присоединяем к комнате беседы
      await client.join(`conversation:${conversationId}`);
      
      // Добавляем пользователя в активный чат в Redis
      await this.redisService.addUserToChat(conversationId, user.id);
      
      client.emit('room-joined', { conversationId });
      this.logger.log(`User ${user.email} joined conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Join room error:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('send-message')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() sendMessageDto: SendMessageDto,
  ) {
    try {
      const user = client.data.user;
      
      // Создаем сообщение через сервис
      const message = await this.chatService.createMessage({
        ...sendMessageDto,
        senderId: user.id,
      });

      // Отправляем сообщение всем участникам беседы
      this.server
        .to(`conversation:${sendMessageDto.conversationId}`)
        .emit('new-message', message);

      this.logger.log(`Message sent by ${user.email} in conversation ${sendMessageDto.conversationId}`);
    } catch (error) {
      this.logger.error('Send message error:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    client.to(`conversation:${data.conversationId}`).emit('user-typing', {
      userId: user.id,
      username: user.username,
    });
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    client.to(`conversation:${data.conversationId}`).emit('user-stopped-typing', {
      userId: user.id,
    });
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const user = client.data.user;
      const { conversationId } = data;

      // Покидаем комнату беседы
      await client.leave(`conversation:${conversationId}`);
      
      // Удаляем пользователя из активного чата в Redis
      await this.redisService.removeUserFromChat(conversationId, user.id);
      
      client.emit('room-left', { conversationId });
      this.logger.log(`User ${user.email} left conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Leave room error:', error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }
}
