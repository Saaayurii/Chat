import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, ValidationPipe, UsePipes, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto/join-room.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

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
      
      client.emit('room-left', { conversationId });
      this.logger.log(`User ${user.email} left conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Leave room error:', error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }
}
