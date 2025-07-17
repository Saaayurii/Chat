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
import { PresenceService } from '../common/services/presence.service';
import { PresenceStatus, DeviceType } from '../common/interfaces/presence.interface';

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
    private readonly presenceService: PresenceService,
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
      
      // Определяем тип устройства из User-Agent
      const userAgent = client.handshake.headers['user-agent'] || '';
      let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
      if (/Mobile/.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/Tablet/.test(userAgent)) {
        deviceType = 'tablet';
      }

      // Устанавливаем расширенное присутствие
      const presence = await this.presenceService.setUserOnline(user.id, {
        deviceId: client.id,
        deviceType,
        activity: 'Подключился к чату'
      });
      
      // Уведомляем о подключении
      client.emit('connected', {
        message: 'Successfully connected to chat',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        presence
      });

      // Уведомляем других пользователей о появлении онлайн
      client.broadcast.emit('presence:user_online', {
        userId: user.id,
        presence
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
      
      // Устанавливаем пользователя как оффлайн
      await this.presenceService.setUserOffline(user.id);

      // Уведомляем других пользователей об уходе
      client.broadcast.emit('presence:user_offline', {
        userId: user.id,
        lastSeen: Date.now()
      });
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

      // Формируем данные сообщения для real-time отправки
      const messageData = {
        id: (message._id as any).toString(),
        text: message.text,
        senderId: message.senderId.toString(),
        conversationId: sendMessageDto.conversationId,
        timestamp: message.createdAt,
        type: message.type,
        status: message.status,
        senderName: user.profile?.fullName || user.profile?.username || user.email
      };

      // Отправляем сообщение всем участникам беседы через Socket.IO
      this.server
        .to(`conversation:${sendMessageDto.conversationId}`)
        .emit('new-message', {
          type: 'new_message',
          data: messageData
        });

      // Также кэшируем в Redis для быстрого доступа
      await this.redisService.cacheConversationMessage(sendMessageDto.conversationId, messageData);

      // Подтверждаем отправителю успешную отправку
      client.emit('message-sent', {
        tempId: (sendMessageDto as any).tempId || null,
        messageId: (message._id as any).toString(),
        timestamp: message.createdAt
      });

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

  @SubscribeMessage('get-cached-messages')
  async handleGetCachedMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; limit?: number },
  ) {
    try {
      const user = client.data.user;
      const { conversationId, limit = 50 } = data;

      // Проверяем права доступа к беседе
      const canAccess = await this.chatService.canUserJoinConversation(user.id, conversationId);
      if (!canAccess) {
        client.emit('error', { message: 'Access denied to this conversation' });
        return;
      }

      // Получаем кэшированные сообщения из Redis
      const cachedMessages = await this.redisService.getCachedConversationMessages(conversationId, limit);

      if (cachedMessages.length > 0) {
        // Отправляем кэшированные сообщения
        client.emit('cached-messages', {
          conversationId,
          messages: cachedMessages,
          source: 'cache'
        });
      } else {
        // Если нет кэшированных сообщений, загружаем из базы данных
        const dbMessages = await this.chatService.getConversationMessages(conversationId, limit);
        
        // Преобразуем сообщения для отправки
        const formattedMessages = dbMessages.map(msg => ({
          id: (msg._id as any).toString(),
          text: msg.text,
          senderId: msg.senderId.toString(),
          conversationId: conversationId,
          timestamp: msg.createdAt,
          type: msg.type,
          status: msg.status,
          senderName: (msg.senderId as any)?.profile?.fullName || (msg.senderId as any)?.profile?.username || (msg.senderId as any)?.email || 'Unknown'
        }));

        // Кэшируем сообщения для следующих запросов
        for (const message of formattedMessages) {
          await this.redisService.cacheConversationMessage(conversationId, message);
        }

        client.emit('cached-messages', {
          conversationId,
          messages: formattedMessages,
          source: 'database'
        });
      }

      this.logger.log(`Cached messages sent for conversation ${conversationId} to user ${user.email}`);
    } catch (error) {
      this.logger.error('Get cached messages error:', error);
      client.emit('error', { message: 'Failed to get cached messages' });
    }
  }

  // Новые методы для работы с присутствием

  @SubscribeMessage('presence:heartbeat')
  @UseGuards(WsAuthGuard)
  async handlePresenceHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status?: PresenceStatus; activity?: string }
  ) {
    try {
      const user = client.data.user;
      const { status = PresenceStatus.ONLINE, activity } = data;

      const userAgent = client.handshake.headers['user-agent'] || '';
      let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
      if (/Mobile/.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/Tablet/.test(userAgent)) {
        deviceType = 'tablet';
      }

      const presence = await this.presenceService.updateUserPresence(user.id, status, {
        deviceId: client.id,
        deviceType,
        activity
      });

      // Уведомляем других пользователей об обновлении присутствия
      client.broadcast.emit('presence:update', {
        userId: user.id,
        presence
      });

    } catch (error) {
      this.logger.error('Presence heartbeat error:', error);
      client.emit('error', { message: 'Failed to update presence' });
    }
  }

  @SubscribeMessage('presence:request')
  @UseGuards(WsAuthGuard)
  async handlePresenceRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds?: string[] }
  ) {
    try {
      const user = client.data.user;
      
      if (data.userIds && data.userIds.length > 0) {
        // Получаем присутствие для конкретных пользователей
        const presenceData = await this.presenceService.getMultipleUserPresence(data.userIds);
        client.emit('presence:bulk_update', presenceData);
      } else {
        // Получаем список всех онлайн пользователей
        const onlineUsers = await this.presenceService.getOnlineUsers(100);
        const presenceMap: { [userId: string]: any } = {};
        
        onlineUsers.forEach(onlineUser => {
          presenceMap[onlineUser.userId] = {
            status: onlineUser.status,
            lastSeen: onlineUser.lastSeen
          };
        });
        
        client.emit('presence:bulk_update', presenceMap);
      }

    } catch (error) {
      this.logger.error('Presence request error:', error);
      client.emit('error', { message: 'Failed to get presence data' });
    }
  }

  @SubscribeMessage('presence:set_status')
  @UseGuards(WsAuthGuard)
  async handleSetPresenceStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: PresenceStatus; activity?: string }
  ) {
    try {
      const user = client.data.user;
      const { status, activity } = data;

      const userAgent = client.handshake.headers['user-agent'] || '';
      let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
      if (/Mobile/.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/Tablet/.test(userAgent)) {
        deviceType = 'tablet';
      }

      const presence = await this.presenceService.updateUserPresence(user.id, status, {
        deviceId: client.id,
        deviceType,
        activity
      });

      // Уведомляем пользователя об успешном обновлении
      client.emit('presence:status_updated', { presence });

      // Уведомляем других пользователей об изменении статуса
      if (status === PresenceStatus.ONLINE) {
        client.broadcast.emit('presence:user_online', {
          userId: user.id,
          presence
        });
      } else if (status === PresenceStatus.OFFLINE) {
        client.broadcast.emit('presence:user_offline', {
          userId: user.id,
          lastSeen: presence.lastSeen
        });
      } else {
        client.broadcast.emit('presence:update', {
          userId: user.id,
          presence
        });
      }

    } catch (error) {
      this.logger.error('Set presence status error:', error);
      client.emit('error', { message: 'Failed to set presence status' });
    }
  }

  @SubscribeMessage('presence:get_history')
  @UseGuards(WsAuthGuard)
  async handleGetPresenceHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; limit?: number }
  ) {
    try {
      const user = client.data.user;
      const targetUserId = data.userId || user.id;
      const limit = data.limit || 10;

      // Проверяем права доступа (пользователь может получить только свою историю или если он админ/оператор)
      if (targetUserId !== user.id && !['admin', 'operator'].includes(user.role)) {
        client.emit('error', { message: 'Access denied' });
        return;
      }

      const history = await this.presenceService.getUserPresenceHistory(targetUserId, limit);
      client.emit('presence:history', { userId: targetUserId, history });

    } catch (error) {
      this.logger.error('Get presence history error:', error);
      client.emit('error', { message: 'Failed to get presence history' });
    }
  }
}
