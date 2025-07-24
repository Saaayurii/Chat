import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { Message, MessageDocument, MessageType, MessageStatus } from '../database/schemas/message.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto/create-conversation.dto';
import { CreateAnonymousConversationDto } from './dto/create-anonymous-conversation.dto';
import { SendAnonymousMessageDto } from './dto/send-anonymous-message.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { UploadedFile } from '../common/interfaces/uploaded-file.interface';
import { MessageCacheService } from '../common/services/message-cache.service';
import { NotificationService } from '../common/services/notification.service';
import { RateLimitService } from '../common/services/rate-limit.service';
import { RedisService } from '../common/services/redis.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly messageCacheService: MessageCacheService,
    private readonly notificationService: NotificationService,
    private readonly rateLimitService: RateLimitService,
    private readonly redisService: RedisService,
  ) {}

  async canUserJoinConversation(userId: string | null, conversationId: string, sessionId?: string): Promise<boolean> {
    try {
      const conversation = await this.conversationModel.findById(conversationId);
      
      console.log(`canUserJoinConversation check: userId=${userId}, conversationId=${conversationId}, sessionId=${sessionId}`);
      console.log(`Found conversation: ${conversation ? 'YES' : 'NO'}`);
      
      if (!conversation) {
        console.log('Conversation not found');
        return false;
      }

      console.log(`Conversation details: type=${conversation.type}, createdBy=${conversation.createdBy}, participants=${conversation.participants.map(p => p.toString())}`);
      if (conversation.anonymousUser) {
        console.log(`Anonymous user: sessionId=${conversation.anonymousUser.sessionId}`);
      }

      // Если передан sessionId, проверяем анонимного пользователя
      if (sessionId) {
        console.log('Checking anonymous user access...');
        const result = this.canAnonymousUserJoinConversation(conversation, sessionId);
        console.log(`Anonymous access result: ${result}`);
        return result;
      }
      
      // Если userId null, но нет sessionId - отказываем в доступе
      if (!userId) {
        console.log('No userId and no sessionId - access denied');
        return false;
      }

      // Получаем роль пользователя
      const user = await this.userModel.findById(userId).select('role');
      console.log(`User found: ${user ? 'YES' : 'NO'}, role=${user?.role}`);
      
      // Админы могут присоединиться к любому разговору
      if (user?.role === 'admin') {
        console.log('Admin access granted');
        return true;
      }

      // Операторы могут присоединяться к любым беседам (особенно анонимным)
      if (user?.role === 'operator') {
        console.log('Operator access granted');
        return true;
      }

      // Проверяем, является ли пользователь участником беседы
      const isParticipant = conversation.participants.some(
        participantId => participantId.toString() === userId
      );

      // Также проверяем, является ли пользователь создателем беседы (для анонимных бесед)
      const isCreator = conversation.createdBy && conversation.createdBy.toString() === userId;

      // Для анонимных бесед разрешаем доступ авторизованным пользователям 
      // (так как ChatWidget создает анонимные беседы даже для авторизованных пользователей)
      let canAccessAnonymousConversation = false;
      if (conversation.type === 'anonymous-support' && user?.role === 'visitor') {
        canAccessAnonymousConversation = true;
        console.log('Visitor user granted access to anonymous conversation');
      }

      console.log(`Access check: isParticipant=${isParticipant}, isCreator=${isCreator}, canAccessAnonymousConversation=${canAccessAnonymousConversation}`);

      return isParticipant || isCreator || canAccessAnonymousConversation;
    } catch (error) {
      console.error('Error in canUserJoinConversation:', error);
      return false;
    }
  }

  private canAnonymousUserJoinConversation(conversation: any, sessionId: string): boolean {
    console.log(`Anonymous access check: sessionId=${sessionId}, conversation.type=${conversation.type}`);
    console.log(`Conversation anonymous sessionId: ${conversation.anonymousUser?.sessionId}`);
    
    // Анонимные пользователи могут подключиться только к своим беседам
    if (conversation.type === 'anonymous-support' && 
        conversation.anonymousUser?.sessionId === sessionId) {
      console.log('Anonymous user access granted - sessionId matches');
      return true;
    }
    
    console.log('Anonymous user access denied - sessionId mismatch or not anonymous-support conversation');
    return false;
  }

  async createMessage(createMessageData: SendMessageDto & { senderId: string }) {
    const { conversationId, text, senderId, type = MessageType.TEXT } = createMessageData;

    // Проверяем rate limit для сообщений
    const rateLimitResult = await this.rateLimitService.checkMessageRateLimit(senderId, conversationId);
    if (!rateLimitResult.allowed) {
      throw new ForbiddenException(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds`);
    }

    // Проверяем существование беседы
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Беседа не найдена');
    }

    // Проверяем, что пользователь может отправлять сообщения в эту беседу
    const canSendMessage = await this.canUserJoinConversation(senderId, conversationId);

    console.log('Проверка права отправки сообщения:');
    console.log('senderId:', senderId);
    console.log('conversation.participants:', conversation.participants.map(p => p.toString()));
    console.log('canSendMessage:', canSendMessage);

    if (!canSendMessage) {
      throw new ForbiddenException('Вы не можете отправлять сообщения в эту беседу');
    }

    // Создаем сообщение
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      text,
      type,
      status: MessageStatus.SENT,
      readBy: [new Types.ObjectId(senderId)], // Автор автоматически прочитал сообщение
      readTimestamps: new Map([[senderId, new Date()]]),
    });

    const savedMessage = await message.save();
    const populatedMessage = await savedMessage.populate('senderId', 'email profile.username profile.avatarUrl');

    // Получаем список получателей (все участники кроме отправителя)
    const recipientIds = conversation.participants
      .filter(pid => pid.toString() !== senderId)
      .map(pid => pid.toString());

    // Отправляем уведомления через pub/sub
    await this.notificationService.publishMessageNotification(
      conversationId,
      populatedMessage,
      recipientIds
    );

    // Обновляем последнее сообщение в беседе
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        'lastMessage.text': text,
        'lastMessage.senderId': new Types.ObjectId(senderId),
        'lastMessage.timestamp': new Date(),
      },
      $inc: { 
        unreadMessagesCount: 1,
        // Увеличиваем счетчик непрочитанных для всех участников кроме отправителя
        ...Object.fromEntries(
          recipientIds.map(pid => [`unreadByParticipant.${pid}`, 1])
        )
      }
    });

    // Записываем метрики
    await this.redisService.incrementMetric('messages_sent');
    await this.redisService.incrementMetric(`messages_sent_by_user:${senderId}`);
    await this.redisService.recordUserActivity(senderId, 'message_sent', {
      conversationId,
      messageType: type,
      messageLength: text.length
    });

    return populatedMessage;
  }

  async getConversationMessages(conversationId: string, limit: number = 50, page: number = 1): Promise<MessageDocument[]> {
    try {
      const skip = (page - 1) * limit;
      
      this.logger.log(`Getting conversation messages: conversationId=${conversationId}, limit=${limit}, page=${page}, skip=${skip}`);
      
      const messages = await this.messageModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .sort({ createdAt: -1 }) // Сортируем по убыванию (новые сначала)
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'email firstName lastName profile role')
        .exec();

      this.logger.log(`Found ${messages.length} messages for conversation ${conversationId}`);

      // Обогащаем сообщения правильными именами отправителей
      const enrichedMessages = messages.map(msg => {
        const sender = msg.senderId as any;
        let senderName = 'Неизвестный';
        
        if (sender) {
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
        
        // Обновляем senderName в сообщении
        (msg as any).senderName = senderName;
        return msg;
      });

      return enrichedMessages.reverse(); // Возвращаем в хронологическом порядке
    } catch (error) {
      this.logger.error('Error getting conversation messages:', error);
      this.logger.error('Error details:', error.stack);
      return [];
    }
  }

  async getConversationMessagesWithAuth(conversationId: string, userId: string, limit = 50, skip = 0) {
    // Проверяем доступ к беседе
    const canAccess = await this.canUserJoinConversation(userId, conversationId);
    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этой беседе');
    }

    // Пробуем получить сообщения из кэша с fallback на БД
    const result = await this.messageCacheService.getMessages(
      conversationId,
      limit,
      skip,
      async (convId, lmt, skp) => {
        // Fallback функция для получения из БД
        this.logger.debug(`Fallback to DB: conversationId=${convId}, limit=${lmt}, skip=${skp}`);
        const messages = await this.messageModel
          .find({ conversationId: new Types.ObjectId(convId) })
          .populate('senderId', 'email profile.username profile.avatarUrl')
          .sort({ createdAt: -1 })
          .limit(lmt)
          .skip(skp)
          .exec();

        this.logger.debug(`Found ${messages.length} messages in DB for conversation ${convId}`);
        return messages.reverse(); // Возвращаем в хронологическом порядке
      }
    );

    return {
      messages: result.messages,
      fromCache: result.fromCache,
      cacheInfo: result.cacheInfo
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const deduplicationKey = `read_status:${conversationId}:${userId}`;
    
    try {
      // Check Redis deduplication lock (5 second cooldown)
      const client = this.redisService.getClient();
      if (client) {
        const existingLock = await client.get(deduplicationKey);
        if (existingLock) {
          this.logger.debug(`Skipping markMessagesAsRead for ${userId} in ${conversationId} - too frequent (${existingLock})`);
          return; // Skip if marked as read within last 5 seconds
        }

        // Set deduplication lock
        await client.setEx(deduplicationKey, 5, Date.now().toString());
      }

      // Check if there are actually any unread messages before updating
      const unreadCount = await this.messageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
      });

      if (unreadCount === 0) {
        this.logger.debug(`No unread messages for user ${userId} in conversation ${conversationId}`);
        return; // No unread messages to mark
      }

      this.logger.log(`Marking ${unreadCount} messages as read for user ${userId} in conversation ${conversationId}`);

      // Помечаем сообщения как прочитанные
      const updateResult = await this.messageModel.updateMany(
        {
          conversationId: new Types.ObjectId(conversationId),
          senderId: { $ne: userObjectId }, // Не свои сообщения
          readBy: { $ne: userObjectId }, // Еще не прочитанные
        },
        {
          $addToSet: { readBy: userObjectId },
          $set: { [`readTimestamps.${userId}`]: new Date() },
        }
      );

      if (updateResult.modifiedCount === 0) {
        this.logger.debug(`No messages were updated for user ${userId} in conversation ${conversationId}`);
        return; // No messages were actually updated
      }

      // Обнуляем счетчик непрочитанных для этого пользователя
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $set: { [`unreadByParticipant.${userId}`]: 0 }
      });

      // Отправляем real-time уведомление о том, что сообщения прочитаны
      try {
        await this.notificationService.publishSystemNotification(
          'messages-read',
          {
            conversationId,
            readBy: userId,
            readAt: new Date().toISOString(),
            messagesMarked: updateResult.modifiedCount
          },
          undefined, // Отправляем всем участникам беседы
          'normal'
        );
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления о прочтении:', notificationError);
      }

      this.logger.log(`Successfully marked ${updateResult.modifiedCount} messages as read for user ${userId}`);
    } catch (error) {
      // Remove lock on error to allow retry
      const client = this.redisService.getClient();
      if (client) {
        await client.del(deduplicationKey);
      }
      throw error;
    }
  }

  async markSingleMessageAsRead(conversationId: string, messageId: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const messageObjectId = new Types.ObjectId(messageId);
    const deduplicationKey = `read_single:${messageId}:${userId}`;

    try {
      // Check Redis deduplication lock
      const client = this.redisService.getClient();
      if (client) {
        const existingLock = await client.get(deduplicationKey);
        if (existingLock) {
          this.logger.debug(`Skipping markSingleMessageAsRead for message ${messageId} by user ${userId} - already processed`);
          return;
        }
      }

      // Проверяем, что сообщение существует и принадлежит к указанной беседе
      const message = await this.messageModel.findOne({
        _id: messageObjectId,
        conversationId: new Types.ObjectId(conversationId)
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Проверяем, что это не сообщение самого пользователя
      if (message.senderId.toString() === userId) {
        return; // Не нужно отмечать свои сообщения как прочитанные
      }

      // Проверяем, что сообщение еще не прочитано этим пользователем
      if (message.readBy && message.readBy.some(id => id.toString() === userId)) {
        this.logger.debug(`Message ${messageId} already read by user ${userId}`);
        return;
      }

      // Set deduplication lock
      if (client) {
        await client.setEx(deduplicationKey, 10, Date.now().toString());
      }

      // Отмечаем сообщение как прочитанное
      const updateResult = await this.messageModel.findByIdAndUpdate(messageObjectId, {
        $addToSet: { readBy: userObjectId },
        $set: { 
          [`readTimestamps.${userId}`]: new Date(),
          isRead: true // Устанавливаем общий флаг прочтения
        }
      });

      if (!updateResult) {
        this.logger.debug(`Message ${messageId} was not updated - already read by user ${userId}`);
        return;
      }

      // Пересчитываем количество непрочитанных сообщений для пользователя в этой беседе
      const unreadCount = await this.messageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
      });

      // Обновляем счетчик непрочитанных в беседе
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $set: { [`unreadByParticipant.${userId}`]: unreadCount }
      });

      // Отправляем real-time уведомление о прочтении конкретного сообщения
      try {
        await this.notificationService.publishSystemNotification(
          'message-read',
          {
            conversationId,
            messageId,
            readBy: userId,
            readAt: new Date().toISOString()
          },
          undefined, // Отправляем всем участникам беседы
          'normal'
        );
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления о прочтении сообщения:', notificationError);
      }

      this.logger.log(`Message ${messageId} marked as read by user ${userId} in conversation ${conversationId}`);
    } catch (error) {
      // Remove lock on error to allow retry
      const client = this.redisService.getClient();
      if (client) {
        await client.del(deduplicationKey);
      }
      throw error;
    }
  }

  async createConversation(createData: CreateConversationDto) {
    const conversation = new this.conversationModel({
      participants: createData.participantIds.map(id => new Types.ObjectId(id)),
      type: createData.type,
      title: createData.title,
      description: createData.description,
      createdBy: new Types.ObjectId(createData.createdBy),
      relatedQuestionId: createData.relatedQuestionId ? new Types.ObjectId(createData.relatedQuestionId) : undefined,
      unreadByParticipant: new Map(
        createData.participantIds.map(id => [id, 0])
      ),
    });

    return conversation.save();
  }

  async getUserConversations(userId: string) {
    // Получаем информацию о пользователе для проверки роли
    const user = await this.userModel.findById(userId).select('role');
    
    let query = {};
    
    if (user?.role === 'admin') {
      // Админы видят все разговоры
      query = { status: { $ne: 'DELETED' } };
    } else if (user?.role === 'operator') {
      // Операторы видят только назначенные им беседы + беседы где они участники + неназначенные беседы
      query = {
        $or: [
          { assignedOperator: new Types.ObjectId(userId) }, // Назначенные им беседы
          { participants: new Types.ObjectId(userId) }, // Беседы где они участники
          { 
            assignedOperator: { $exists: false }, 
            type: { $in: ['anonymous-support', 'user-operator'] },
            status: { $ne: 'DELETED' }
          } // Неназначенные беседы поддержки
        ],
        status: { $ne: 'DELETED' }
      };
    } else {
      // Обычные пользователи видят только свои разговоры
      query = { 
        participants: new Types.ObjectId(userId),
        status: { $ne: 'DELETED' }
      };
    }
    
    return this.conversationModel
      .find(query)
      .populate('participants', 'email profile.username profile.avatarUrl role')
      .populate('assignedOperator', 'email profile.username profile.fullName')
      .populate('lastMessage.senderId', 'profile.username')
      .sort({ updatedAt: -1 })
      .limit(100) // Ограничиваем количество разговоров
      .exec();
  }

  async getConversation(conversationId: string, userId: string) {
    // Проверяем доступ
    const canAccess = await this.canUserJoinConversation(userId, conversationId);
    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этой беседе');
    }

    return this.conversationModel
      .findById(conversationId)
      .populate('participants', 'email profile.username profile.avatarUrl role')
      .populate('lastMessage.senderId', 'profile.username')
      .exec();
  }


  async uploadAttachment(conversationId: string, userId: string, file: UploadedFile, uploadDto: UploadAttachmentDto) {
    // Проверяем доступ к беседе
    const canAccess = await this.canUserJoinConversation(userId, conversationId);
    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этой беседе');
    }

    // Сохраняем файл и создаем сообщение с вложением
    const attachmentUrl = await this.saveAttachment(file, userId);
    
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(userId),
      text: uploadDto.description || file.originalname,
      type: file.mimetype.startsWith('image/') ? MessageType.IMAGE : MessageType.FILE,
      status: MessageStatus.SENT,
      attachments: [{
        fileName: file.originalname,
        fileUrl: attachmentUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      }],
      readBy: [new Types.ObjectId(userId)],
    });

    const savedMessage = await message.save();
    return savedMessage.populate('senderId', 'email profile.username profile.avatarUrl');
  }

  private async saveAttachment(file: UploadedFile, userId: string): Promise<string> {
    // Упрощенное сохранение файла (в продакшене использовать облачное хранилище)
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}-${file.originalname}`;
    const filePath = `uploads/attachments/${fileName}`;
    
    // Здесь должна быть логика сохранения файла
    // В продакшене: AWS S3, Cloudinary, etc.
    
    return `/${filePath}`;
  }

  /**
   * Устанавливает статус набора текста для пользователя в беседе
   */
  async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    // Проверяем доступ к беседе
    const canAccess = await this.canUserJoinConversation(userId, conversationId);
    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этой беседе');
    }

    // Публикуем уведомление о статусе набора
    await this.notificationService.publishTypingNotification(conversationId, userId, isTyping);

    // Сохраняем статус в Redis с TTL 10 секунд
    const typingKey = `typing:${conversationId}:${userId}`;
    if (isTyping) {
      await this.redisService.getClient()?.setEx(typingKey, 10, 'true');
    } else {
      await this.redisService.getClient()?.del(typingKey);
    }
  }

  /**
   * Получает список пользователей, которые сейчас печатают в беседе
   */
  async getTypingUsers(conversationId: string, userId: string): Promise<string[]> {
    // Проверяем доступ к беседе
    const canAccess = await this.canUserJoinConversation(userId, conversationId);
    if (!canAccess) {
      return [];
    }

    try {
      const client = this.redisService.getClient();
      if (!client) return [];

      const typingKeys = await client.keys(`typing:${conversationId}:*`);
      const typingUsers = typingKeys
        .map(key => key.split(':')[2])
        .filter(typingUserId => typingUserId !== userId); // Исключаем самого пользователя

      return typingUsers;
    } catch (error) {
      return [];
    }
  }

  /**
   * Добавляет сообщение в очередь обработки
   */
  async enqueueMessageProcessing(messageData: any, priority: number = 0): Promise<void> {
    await this.redisService.enqueueTask('message_processing', {
      type: 'process_message',
      data: messageData,
      enqueuedAt: Date.now()
    }, priority);
  }

  /**
   * Обрабатывает задачи из очереди сообщений
   */
  async processMessageQueue(): Promise<void> {
    const task = await this.redisService.dequeueTask('message_processing');
    
    if (task) {
      try {
        // Обработка задачи (например, модерация, перевод, анализ тональности)
        await this.processMessageTask(task);
        
        // Записываем метрику успешной обработки
        await this.redisService.incrementMetric('message_queue_processed');
      } catch (error) {
        // В случае ошибки возвращаем задачу в очередь
        await this.redisService.requeueFailedTask('message_processing', task);
        await this.redisService.incrementMetric('message_queue_failed');
      }
    }
  }

  /**
   * Обрабатывает конкретную задачу из очереди
   */
  private async processMessageTask(task: any): Promise<void> {
    switch (task.data.type) {
      case 'process_message':
        // Здесь может быть модерация контента, проверка на спам и т.д.
        break;
      case 'send_notification':
        // Отправка отложенных уведомлений
        break;
      case 'update_analytics':
        // Обновление аналитических данных
        break;
    }
  }

  /**
   * Получает метрики чата
   */
  async getChatMetrics(startDate?: string, endDate?: string): Promise<{
    messagesSent: number;
    activeConversations: number;
    averageResponseTime: number;
    topActiveUsers: Array<{ userId: string; messageCount: number }>;
    hourlyDistribution: { [hour: string]: number };
  }> {
    const today = new Date().toISOString().split('T')[0];
    const targetStartDate = startDate || today;
    const targetEndDate = endDate || today;

    const [
      messagesSent,
      activeConversations,
      hourlyDistribution
    ] = await Promise.all([
      this.redisService.getMetricsRange('messages_sent', targetStartDate, targetEndDate),
      this.getActiveConversationsCount(),
      this.getHourlyMessageDistribution(targetStartDate)
    ]);

    return {
      messagesSent: Object.values(messagesSent).reduce((sum, count) => sum + count, 0),
      activeConversations,
      averageResponseTime: 0, // TODO: Implement response time calculation
      topActiveUsers: [], // TODO: Implement top users calculation
      hourlyDistribution: hourlyDistribution
    };
  }

  /**
   * Получает количество активных бесед
   */
  private async getActiveConversationsCount(): Promise<number> {
    try {
      const client = this.redisService.getClient();
      if (!client) return 0;

      const activeChats = await client.keys('chat:*:users');
      return activeChats.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Получает почасовое распределение сообщений
   */
  private async getHourlyMessageDistribution(date: string): Promise<{ [hour: string]: number }> {
    const distribution: { [hour: string]: number } = {};
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      const count = await this.redisService.getMetric(`messages_sent:${date}:${hour}`);
      distribution[hourStr] = count;
    }

    return distribution;
  }

  /**
   * Очищает устаревшие данные чата
   */
  async cleanupOldChatData(): Promise<{ 
    clearedMessages: number; 
    clearedTypingStatus: number; 
    clearedTempFiles: number; 
  }> {
    const client = this.redisService.getClient();
    if (!client) {
      return { clearedMessages: 0, clearedTypingStatus: 0, clearedTempFiles: 0 };
    }

    let clearedMessages = 0;
    let clearedTypingStatus = 0;

    // Очищаем устаревшие статусы набора (старше 30 секунд)
    const typingKeys = await client.keys('typing:*');
    for (const key of typingKeys) {
      const ttl = await client.ttl(key);
      if (ttl <= 0) {
        await client.del(key);
        clearedTypingStatus++;
      }
    }

    // Очищаем устаревшие временные файлы
    const clearedTempFiles = await this.redisService.cleanupExpiredTempFiles();

    return {
      clearedMessages,
      clearedTypingStatus,
      clearedTempFiles
    };
  }

  /**
   * Получает статистику кэша для конкретной беседы
   */
  async getCacheStats(conversationId: string): Promise<{
    messageCount: number;
    lastCached: number | null;
    ttl: number;
    isEnabled: boolean;
  }> {
    return this.messageCacheService.getCacheStats(conversationId);
  }

  /**
   * Добавляет сообщение в кэш
   */
  async addMessageToCache(message: any): Promise<void> {
    await this.messageCacheService.addMessage(message);
  }

  /**
   * Очищает кэш сообщений для беседы
   */
  async clearMessageCache(conversationId: string): Promise<void> {
    await this.messageCacheService.clearCache(conversationId);
  }

  /**
   * Создает беседу для анонимного пользователя
   */
  async createAnonymousConversation(createData: CreateAnonymousConversationDto) {
    try {
      console.log('Создание анонимной беседы:', createData);
      
      // Находим лучшего доступного оператора с учетом нагрузки
      let operator: any = null;
      
      // Сначала пробуем найти онлайн операторов
      const onlineOperators = await this.userModel.aggregate([
        {
          $match: {
            role: 'operator',
            isBlocked: false,
            'profile.isOnline': true
          }
        },
        {
          $lookup: {
            from: 'conversations',
            let: { operatorId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$assignedOperator', '$$operatorId'] },
                      { $ne: ['$status', 'DELETED'] },
                      { $ne: ['$status', 'closed'] }
                    ]
                  }
                }
              }
            ],
            as: 'assignedConversations'
          }
        },
        {
          $addFields: {
            activeChatsCount: { $size: '$assignedConversations' }
          }
        },
        {
          $sort: { activeChatsCount: 1 } // Сортируем по количеству активных чатов (меньше = лучше)
        },
        {
          $limit: 1
        }
      ]);

      if (onlineOperators.length > 0) {
        operator = onlineOperators[0];
      } else {
        // Если нет онлайн операторов, выбираем любого с наименьшей нагрузкой
        const allOperators = await this.userModel.aggregate([
          {
            $match: {
              role: 'operator',
              isBlocked: false
            }
          },
          {
            $lookup: {
              from: 'conversations',
              let: { operatorId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$assignedOperator', '$$operatorId'] },
                        { $ne: ['$status', 'DELETED'] },
                        { $ne: ['$status', 'closed'] }
                      ]
                    }
                  }
                }
              ],
              as: 'assignedConversations'
            }
          },
          {
            $addFields: {
              activeChatsCount: { $size: '$assignedConversations' }
            }
          },
          {
            $sort: { activeChatsCount: 1 }
          },
          {
            $limit: 1
          }
        ]);

        if (allOperators.length > 0) {
          operator = allOperators[0];
        }
      }

      if (!operator) {
        throw new Error('В системе нет зарегистрированных операторов');
      }

      console.log(`Выбранный оператор: ${operator._id} (активных чатов: ${operator.activeChatsCount || 0})`);
      
      // Всегда считаем что есть онлайн операторы (для создания приветственного сообщения)
      const hasOnlineOperators = true; // operator ? true : false;
      console.log('Есть назначенный оператор:', !!operator, 'создаем приветственное сообщение:', hasOnlineOperators);

    // Определяем, авторизован ли пользователь
    let actualUser: any = null;
    let isAuthorizedUser = false;
    
    if (createData.userId) {
      // Пользователь авторизован, получаем его данные из БД
      actualUser = await this.userModel.findById(createData.userId).exec();
      isAuthorizedUser = !!actualUser;
      console.log('Найден авторизованный пользователь:', actualUser ? 'да' : 'нет');
    }
    
    // Создаем данные пользователя (реального или анонимного)
    const userData: any = isAuthorizedUser ? null : {
      _id: new Types.ObjectId(),
      email: createData.visitorEmail || `anonymous_${createData.sessionId}@widget.temp`,
      profile: {
        username: createData.visitorName,
        fullName: createData.visitorName,
        isOnline: true,
        lastSeenAt: new Date(),
      },
      role: 'VISITOR',
      isActivated: true,
      isBlocked: false,
      isAnonymous: true,
      sessionId: createData.sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

      console.log('Создание модели беседы...');
      
      // Определяем участников беседы
      const participants = isAuthorizedUser 
        ? [operator._id, actualUser._id] // Авторизованный пользователь + оператор
        : [operator._id, userData._id]; // Анонимный пользователь + оператор
      
      // Определяем тип беседы
      const conversationType = isAuthorizedUser ? 'user-operator' : 'anonymous-support';
      
      // Создаем мапу непрочитанных сообщений
      const unreadByParticipant = isAuthorizedUser
        ? new Map([
            [actualUser._id.toString(), 0],
            [operator._id.toString(), 0]
          ])
        : new Map([
            [userData._id.toString(), 0],
            [operator._id.toString(), 0]
          ]);
      
      const conversation = new this.conversationModel({
        participants: participants,
        type: conversationType,
        title: createData.title || `Обращение от ${createData.visitorName}`,
        description: isAuthorizedUser ? 'Беседа с оператором' : 'Анонимная беседа с оператором',
        createdBy: isAuthorizedUser ? actualUser._id : userData._id,
        assignedOperator: operator._id, // Назначаем оператора
        anonymousUser: userData, // Сохраняем данные анонимного пользователя (если анонимный)
        unreadByParticipant: unreadByParticipant,
        status: 'active',
        waitingForAssignment: !hasOnlineOperators, // Ожидает назначения, если нет онлайн операторов
      });

      console.log('Сохранение беседы...');
      const savedConversation = await conversation.save();
      console.log('Беседа сохранена:', savedConversation._id);

      // Если есть начальное сообщение, создаем его
      if (createData.initialMessage) {
        console.log('Создание начального сообщения...');
        try {
          await this.createAnonymousMessage({
            conversationId: (savedConversation._id as Types.ObjectId).toString(),
            text: createData.initialMessage,
            sessionId: createData.sessionId,
            senderName: createData.visitorName,
          });
          console.log('Начальное сообщение создано');
        } catch (messageError) {
          console.error('Ошибка создания начального сообщения:', messageError);
          // Не прерываем выполнение, беседа уже создана
        }
      }

      // Добавляем приветственное сообщение с именем оператора
      if (hasOnlineOperators) {
        console.log('Добавление приветственного сообщения от оператора...');
        try {
          const operatorName = operator.profile?.fullName || operator.profile?.username || 'Оператор';
          const welcomeMessage = new this.messageModel({
            conversationId: savedConversation._id,
            senderId: operator._id,
            text: `Добро пожаловать! Как могу помочь? Вас обслуживает ${operatorName}.`,
            type: MessageType.TEXT,
            status: MessageStatus.SENT,
            senderName: operatorName,
            isSystemMessage: true,
            readBy: [operator._id],
            readTimestamps: new Map([[operator._id.toString(), new Date()]]),
          });
          
          await welcomeMessage.save();
          console.log('Приветственное сообщение добавлено');
        } catch (welcomeMessageError) {
          console.error('Ошибка создания приветственного сообщения:', welcomeMessageError);
        }
      } else {
        // Если нет онлайн операторов, добавляем системное сообщение
        console.log('Добавление системного сообщения об отсутствии онлайн операторов...');
        try {
          const systemMessage = new this.messageModel({
            conversationId: savedConversation._id,
            senderId: operator._id,
            text: 'В данный момент все операторы не в сети. Ваше сообщение будет обработано при первой возможности.',
            type: MessageType.TEXT,
            status: MessageStatus.SENT,
            senderName: 'Система',
            isSystemMessage: true,
            readBy: [operator._id],
            readTimestamps: new Map([[operator._id.toString(), new Date()]]),
          });
          
          await systemMessage.save();
          console.log('Системное сообщение добавлено');
        } catch (systemMessageError) {
          console.error('Ошибка создания системного сообщения:', systemMessageError);
        }
      }

      console.log('Беседа создана:', savedConversation._id);
      
      // Возвращаем беседу с заполненной информацией об операторе
      const populatedConversation = await this.conversationModel
        .findById(savedConversation._id)
        .populate('assignedOperator', 'email profile.username profile.fullName profile.avatarUrl')
        .populate('participants', 'email profile.username profile.fullName role')
        .exec();
      
      // Уведомляем назначенного оператора о новой беседе
      if (operator && populatedConversation) {
        try {
          await this.notificationService.publishSystemNotification(
            'new-conversation-assigned',
            {
              conversationId: populatedConversation._id,
              conversation: populatedConversation,
              assignedOperatorId: operator._id,
              userType: isAuthorizedUser ? 'authorized' : 'anonymous',
              userName: createData.visitorName,
              userEmail: createData.visitorEmail,
              hasOnlineOperators
            },
            [operator._id.toString()], // Отправляем только назначенному оператору
            'high'
          );
          console.log(`Оператор ${operator._id} уведомлен о новой беседе`);
        } catch (notificationError) {
          console.error('Ошибка отправки уведомления оператору:', notificationError);
        }
      }
        
      return populatedConversation;
      
    } catch (error) {
      console.error('Ошибка создания анонимной беседы:', error);
      throw error;
    }
  }

  /**
   * Создает сообщение от анонимного пользователя
   */
  async createAnonymousMessage(messageData: SendAnonymousMessageDto & { conversationId: string }) {
    const { conversationId, text, sessionId, senderName, type = MessageType.TEXT } = messageData;

    // Получаем беседу
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Беседа не найдена');
    }

    // Для анонимных бесед проверяем sessionId
    if (conversation.type === 'anonymous-support') {
      if (!conversation.anonymousUser || conversation.anonymousUser.sessionId !== sessionId) {
        throw new ForbiddenException('Неверный идентификатор сессии');
      }
    }

    if (!conversation.anonymousUser) {
      throw new ForbiddenException('Данные анонимного пользователя не найдены');
    }

    // Создаем сообщение
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: conversation.anonymousUser._id,
      text,
      type,
      status: MessageStatus.SENT,
      senderName: senderName || conversation.anonymousUser.profile.username,
      readBy: [conversation.anonymousUser._id],
      readTimestamps: new Map([[conversation.anonymousUser._id.toString(), new Date()]]),
    });

    const savedMessage = await message.save();

    // Добавляем сообщение в кэш Redis
    await this.messageCacheService.addMessage(savedMessage);
    
    // Также сохраняем в Redis для real-time доступа
    await this.redisService.cacheConversationMessage(conversationId, {
      id: (savedMessage._id as Types.ObjectId).toString(),
      text: savedMessage.text,
      senderId: savedMessage.senderId.toString(),
      timestamp: savedMessage.createdAt,
      type: savedMessage.type,
      status: savedMessage.status,
      senderName: senderName || conversation.anonymousUser.profile.username,
    });

    // Получаем операторов для уведомлений
    const operatorIds = conversation.participants
      .filter(pid => pid.toString() !== conversation.anonymousUser!._id.toString())
      .map(pid => pid.toString());

    // Отправляем уведомления операторам
    await this.notificationService.publishMessageNotification(
      conversationId,
      savedMessage,
      operatorIds
    );

    // Обновляем последнее сообщение в беседе
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        'lastMessage.text': text,
        'lastMessage.senderId': conversation.anonymousUser!._id,
        'lastMessage.timestamp': new Date(),
      },
      $inc: { 
        unreadMessagesCount: 1,
        ...Object.fromEntries(
          operatorIds.map(pid => [`unreadByParticipant.${pid}`, 1])
        )
      }
    });

    return savedMessage;
  }

  /**
   * Получает беседу для публичного доступа (без проверки аутентификации)
   */
  async getPublicConversation(conversationId: string) {
    return this.conversationModel
      .findById(conversationId)
      .populate('participants', 'email profile.username profile.avatarUrl role')
      .populate('lastMessage.senderId', 'profile.username')
      .exec();
  }

  /**
   * Отмечает сообщения как прочитанные для анонимного пользователя по sessionId
   */
  async markAnonymousMessagesAsRead(conversationId: string, sessionId: string) {
    // Получаем беседу
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Беседа не найдена');
    }

    // Проверяем, что это анонимная беседа и sessionId совпадает
    if (conversation.type !== 'anonymous-support' || !conversation.anonymousUser || 
        conversation.anonymousUser.sessionId !== sessionId) {
      throw new ForbiddenException('Неверный идентификатор сессии');
    }

    const anonymousUserId = conversation.anonymousUser._id;

    // Помечаем сообщения как прочитанные
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: anonymousUserId }, // Не свои сообщения
        readBy: { $ne: anonymousUserId }, // Еще не прочитанные
      },
      {
        $addToSet: { readBy: anonymousUserId },
        $set: { [`readTimestamps.${anonymousUserId}`]: new Date() },
      }
    );

    // Обнуляем счетчик непрочитанных для анонимного пользователя
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`unreadByParticipant.${anonymousUserId}`]: 0 }
    });

    // Отправляем real-time уведомление о том, что сообщения прочитаны
    try {
      await this.notificationService.publishSystemNotification(
        'messages-read',
        {
          conversationId,
          readBy: anonymousUserId.toString(),
          readAt: new Date().toISOString()
        },
        undefined, // Отправляем всем участникам беседы
        'normal'
      );
    } catch (notificationError) {
      console.error('Ошибка отправки уведомления о прочтении анонимным пользователем:', notificationError);
    }

    return { message: 'Сообщения отмечены как прочитанные' };
  }
}
