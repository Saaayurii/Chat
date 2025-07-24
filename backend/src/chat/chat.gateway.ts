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
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { WsOptionalAuthGuard } from '../common/guards/ws-optional-auth.guard';
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
@UseGuards(WsOptionalAuthGuard)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
    private readonly presenceService: PresenceService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private extractTokenFromClient(client: Socket): string | null {
    const timestamp = new Date().toISOString();
    
    // Попытка получить токен из разных источников
    const authHeader = client.handshake.headers.authorization;
    const tokenFromAuth = client.handshake.auth?.token;
    const tokenFromQuery = client.handshake.query?.token;

    console.log(`[${timestamp}] ChatGateway: Extracting token for client ${client.id}`, {
      authHeader: !!authHeader,
      tokenFromAuth: !!tokenFromAuth,
      tokenFromQuery: !!tokenFromQuery
    });

    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log(`[${timestamp}] ChatGateway: Found token in Authorization header for client ${client.id}`);
      return authHeader.substring(7);
    }
    
    if (tokenFromAuth) {
      console.log(`[${timestamp}] ChatGateway: Found token in auth object for client ${client.id}`);
      return tokenFromAuth;
    }
    
    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      console.log(`[${timestamp}] ChatGateway: Found token in query parameters for client ${client.id}`);
      return tokenFromQuery;
    }

    console.log(`[${timestamp}] ChatGateway: No token found for client ${client.id}`);
    return null;
  }

  private extractSessionIdFromClient(client: Socket): string | null {
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ChatGateway: Extracting sessionId from client ${client.id}`);
    console.log(`[${timestamp}] ChatGateway: handshake.auth:`, client.handshake.auth);
    console.log(`[${timestamp}] ChatGateway: handshake.query:`, client.handshake.query);
    
    const sessionId = client.handshake.auth?.sessionId || client.handshake.query?.sessionId;
    
    console.log(`[${timestamp}] ChatGateway: Extracted sessionId:`, sessionId);
    
    if (sessionId && typeof sessionId === 'string') {
      console.log(`[${timestamp}] ChatGateway: Valid sessionId found:`, sessionId);
      return sessionId;
    }
    
    console.log(`[${timestamp}] ChatGateway: No valid sessionId found`);
    return null;
  }

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
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] ChatGateway: handleConnection called for client ${client.id}`);
      
      // Выполняем аутентификацию вручную в handleConnection
      let user = client.data.user;
      if (!user) {
        console.log(`[${timestamp}] ChatGateway: No user data found, attempting manual authentication`);
        
        // Получаем токен из handshake
        const token = this.extractTokenFromClient(client);
        
        // Также проверяем sessionId для анонимных пользователей
        const sessionId = this.extractSessionIdFromClient(client);
        
        if (!token && !sessionId) {
          console.log(`[${timestamp}] ChatGateway: No token or sessionId found for client ${client.id}, disconnecting`);
          client.disconnect();
          return;
        }
        
        // Если есть sessionId но нет токена - создаем анонимного пользователя
        if (!token && sessionId) {
          console.log(`[${timestamp}] ChatGateway: Creating anonymous user for client ${client.id} with sessionId ${sessionId}`);
          user = {
            id: `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: `anonymous_${sessionId}@widget.temp`,
            firstName: 'Посетитель',
            lastName: 'Сайта',
            role: 'VISITOR',
            isAnonymous: true,
            sessionId: sessionId,
            isActivated: true,
            isBlocked: false
          };
          client.data.user = user;
          console.log(`[${timestamp}] ChatGateway: Anonymous user created for client ${client.id}:`, { 
            id: user.id, 
            sessionId: user.sessionId,
            role: user.role,
            isAnonymous: user.isAnonymous 
          });
        }
        
        // Если есть токен - проверяем JWT
        if (token) {
          console.log(`[${timestamp}] ChatGateway: Token found for client ${client.id}, verifying`);
          
          // Проверяем JWT токен
        try {
          const jwtSecret = this.configService.get<string>('JWT_SECRET');
          const payload = this.jwtService.verify(token, { secret: jwtSecret });
          
          console.log(`[${timestamp}] ChatGateway: JWT verified for client ${client.id}, payload:`, { email: payload.email });
          
          // Сохраняем минимальные данные пользователя
          client.data.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
          };
          
          user = client.data.user;
          console.log(`[${timestamp}] ChatGateway: User data set for client ${client.id}:`, user);
          } catch (error) {
            console.error(`[${timestamp}] ChatGateway: JWT verification failed for client ${client.id}:`, error.message);
            client.disconnect();
            return;
          }
        }
      }
      
      if (!user) {
        console.log(`[${timestamp}] ChatGateway: Still no user data found for client ${client.id}, disconnecting`);
        client.disconnect();
        return;
      }

      console.log(`[${timestamp}] ChatGateway: User data found for client ${client.id}:`, { id: user.id, email: user.email, role: user.role });
      this.logger.log(`Client connected: ${user.email} (${user.id})`);
      
      // Присоединяем пользователя к его персональной комнате
      await client.join(`user:${user.id}`);
      console.log(`[${timestamp}] ChatGateway: Client ${client.id} joined room user:${user.id}`);
      
      // Сохраняем сессию в Redis
      await this.redisService.setSocketSession(client.id, user.id);
      console.log(`[${timestamp}] ChatGateway: Socket session saved for client ${client.id}`);
      
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
      console.log(`[${timestamp}] ChatGateway: Presence set for client ${client.id}`);
      
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
      console.log(`[${timestamp}] ChatGateway: Connected event sent to client ${client.id}`);

      // Уведомляем других пользователей о появлении онлайн
      client.broadcast.emit('presence:user_online', {
        userId: user.id,
        presence
      });
      console.log(`[${timestamp}] ChatGateway: User online broadcast sent for client ${client.id}`);
    } catch (error) {
      console.error(`[${timestamp}] ChatGateway: Connection error for client ${client.id}:`, error);
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

      this.logger.log(`Join room attempt: user=${JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        isAnonymous: user.isAnonymous,
        sessionId: user.sessionId
      })}, conversationId=${conversationId}`);

      // Проверяем, что пользователь может присоединиться к этой беседе
      const canJoin = user.isAnonymous 
        ? await this.chatService.canUserJoinConversation(null, conversationId, user.sessionId)
        : await this.chatService.canUserJoinConversation(user.id, conversationId);
      
      this.logger.log(`Join room access check result: canJoin=${canJoin}`);
      
      if (!canJoin) {
        this.logger.warn(`Access denied for user ${user.email || user.id} to conversation ${conversationId}`);
        client.emit('error', { message: 'Access denied to this conversation' });
        return;
      }

      // Присоединяем к комнате беседы
      await client.join(`conversation:${conversationId}`);
      this.logger.log(`User ${user.email || user.id} successfully joined room: conversation:${conversationId}`);
      
      // Добавляем пользователя в активный чат в Redis
      await this.redisService.addUserToChat(conversationId, user.id);
      
      client.emit('room-joined', { conversationId });
      this.logger.log(`User ${user.email} joined conversation ${conversationId} - room-joined event sent`);
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
      
      // Логируем входящие данные для отладки
      this.logger.log(`Received send-message from ${user.email}:`, JSON.stringify(sendMessageDto));
      
      if (!user) {
        this.logger.error('User not found in client data');
        client.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      // Проверяем обязательные поля
      if (!sendMessageDto.conversationId || !sendMessageDto.text) {
        this.logger.error('Missing required fields:', { 
          conversationId: !!sendMessageDto.conversationId, 
          text: !!sendMessageDto.text 
        });
        client.emit('error', { message: 'Missing required fields: conversationId or text' });
        return;
      }
      
      let message;
      
      if (user.isAnonymous) {
        // Для анонимных пользователей используем createAnonymousMessage
        message = await this.chatService.createAnonymousMessage({
          conversationId: sendMessageDto.conversationId,
          text: sendMessageDto.text,
          sessionId: user.sessionId,
          senderName: 'Посетитель', // Можно получить из handshake данных
          type: sendMessageDto.type
        });
      } else {
        // Для авторизованных пользователей используем обычный метод
        message = await this.chatService.createMessage({
          ...sendMessageDto,
          senderId: user.id,
        });
      }

      // Формируем данные сообщения для real-time отправки
      const messageData = {
        _id: (message._id as any).toString(),
        id: (message._id as any).toString(),
        text: message.text,
        content: message.text, // Добавляем поле content для совместимости
        senderId: message.senderId?._id?.toString() || message.senderId?.toString() || message.senderId,
        conversationId: sendMessageDto.conversationId,
        timestamp: message.createdAt,
        createdAt: message.createdAt,
        type: message.type,
        status: message.status,
        senderName: user.isAnonymous ? 'Посетитель' : (user.profile?.fullName || user.profile?.username || user.fullName || (user.firstName ? user.firstName + (user.lastName ? ' ' + user.lastName : '') : null) || user.email || 'Оператор')
      };

      // Отправляем сообщение всем участникам беседы через Socket.IO
      this.logger.log(`Broadcasting message to room: conversation:${sendMessageDto.conversationId}, senderId: ${messageData.senderId}, content: ${messageData.text}`);
      this.server
        .to(`conversation:${sendMessageDto.conversationId}`)
        .emit('new-message', {
          type: 'new_message',
          data: messageData
        });
      this.logger.log(`Message broadcasted successfully to conversation:${sendMessageDto.conversationId}`);

      // Добавляем сообщение в кэш через MessageCacheService
      await this.chatService.addMessageToCache(messageData);

      // Подтверждаем отправителю успешную отправку
      client.emit('message-sent', {
        tempId: (sendMessageDto as any).tempId || null,
        messageId: (message._id as any).toString(),
        timestamp: message.createdAt
      });

      this.logger.log(`Message sent by ${user.email} in conversation ${sendMessageDto.conversationId}`);
    } catch (error) {
      this.logger.error('Send message error:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        data: sendMessageDto
      });
      client.emit('error', { 
        message: 'Failed to send message',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId?: string },
  ) {
    try {
      const user = client.data.user;
      const { conversationId, messageId } = data;

      // Проверяем права доступа к беседе
      const canAccess = user.isAnonymous 
        ? await this.chatService.canUserJoinConversation(null, conversationId, user.sessionId)
        : await this.chatService.canUserJoinConversation(user.id, conversationId);
      if (!canAccess) {
        client.emit('error', { message: 'Access denied to this conversation' });
        return;
      }

      if (messageId) {
        // Отмечаем отдельное сообщение как прочитанное
        await this.chatService.markSingleMessageAsRead(conversationId, messageId, user.id);
        
        // Уведомляем участников беседы о прочтении сообщения
        this.server.to(`conversation:${conversationId}`).emit('message-read', {
          conversationId,
          messageId,
          readBy: user.id,
          readAt: new Date().toISOString()
        });
        
        this.logger.log(`Message ${messageId} marked as read by ${user.email} in conversation ${conversationId}`);
      } else {
        // Отмечаем все сообщения в беседе как прочитанные
        await this.chatService.markMessagesAsRead(conversationId, user.id);
        
        // Уведомляем участников беседы о прочтении всех сообщений
        this.server.to(`conversation:${conversationId}`).emit('conversation-read', {
          conversationId,
          readBy: user.id,
          readAt: new Date().toISOString()
        });
        
        this.logger.log(`All messages marked as read by ${user.email} in conversation ${conversationId}`);
      }

      // Подтверждаем клиенту успешную отметку
      client.emit('mark-as-read-success', {
        conversationId,
        messageId: messageId || null,
        readAt: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Mark as read error:', error);
      client.emit('error', { message: 'Failed to mark as read' });
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
      const canAccess = user.isAnonymous 
        ? await this.chatService.canUserJoinConversation(null, conversationId, user.sessionId)
        : await this.chatService.canUserJoinConversation(user.id, conversationId);
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
        const formattedMessages = dbMessages.map(msg => {
          const sender = msg.senderId as any;
          let senderName = 'Неизвестный';
          
          // Проверяем senderName в самом сообщении (установленный в getConversationMessages)
          if ((msg as any).senderName) {
            senderName = (msg as any).senderName;
          } else if (sender) {
            if (sender.profile?.fullName) {
              senderName = sender.profile.fullName;
            } else if (sender.firstName) {
              senderName = sender.firstName + (sender.lastName ? ` ${sender.lastName}` : '');
            } else if (sender.email) {
              senderName = sender.role === 'operator' ? `Оператор (${sender.email})` : sender.email;
            } else if (sender.role === 'operator') {
              senderName = 'Оператор';
            }
          }
          
          return {
            id: (msg._id as any).toString(),
            text: msg.text,
            senderId: msg.senderId.toString(),
            conversationId: conversationId,
            timestamp: msg.createdAt,
            type: msg.type,
            status: msg.status,
            senderName: senderName
          };
        });

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
  @UseGuards(WsOptionalAuthGuard)
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
  @UseGuards(WsOptionalAuthGuard)
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
  @UseGuards(WsOptionalAuthGuard)
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
  @UseGuards(WsOptionalAuthGuard)
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

  @SubscribeMessage('user-authenticated')
  async handleUserAuthenticated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; sessionId: string }
  ) {
    try {
      const { userId, sessionId } = data;
      
      this.logger.log(`Обработка user-authenticated: userId=${userId}, sessionId=${sessionId}`);
      
      // Проверяем, что клиент был анонимным
      const currentUser = client.data.user;
      if (!currentUser?.isAnonymous || currentUser.sessionId !== sessionId) {
        this.logger.warn(`Невалидное событие user-authenticated: currentUser=${JSON.stringify(currentUser)}`);
        client.emit('error', { message: 'Invalid authentication event' });
        return;
      }

      // Находим беседу по sessionId
      const conversation = await this.chatService.findConversationBySessionId(sessionId);
      if (!conversation) {
        client.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Получаем conversationId как строку
      const conversationId = (conversation._id as any).toString();

      // Вызываем связывание беседы
      const result = await this.chatService.linkAnonymousConversationToUser(
        conversationId, 
        sessionId, 
        userId
      );
      
      this.logger.log(`Беседа успешно связана: ${conversationId}`);
      
      // Обновляем данные пользователя в сокете
      client.data.user = {
        ...currentUser,
        id: userId,
        isAnonymous: false,
        sessionId: undefined
      };

      // Уведомляем клиента об успешной связи
      client.emit('conversation-linked', {
        conversationId: conversationId,
        userId: userId,
        messagesUpdated: result.messagesUpdated
      });

      // Уведомляем всех участников беседы о смене статуса
      this.server.to(`conversation:${conversationId}`).emit('user-status-changed', {
        conversationId: conversationId,
        userId: userId,
        isAnonymous: false
      });

      this.logger.log(`Пользователь ${userId} успешно аутентифицирован и связан с беседой ${conversationId}`);

    } catch (error) {
      this.logger.error('User authenticated error:', error);
      client.emit('error', { message: 'Failed to process authentication' });
    }
  }
}
