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

  async canUserJoinConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      const conversation = await this.conversationModel.findById(conversationId);
      
      if (!conversation) {
        return false;
      }

      // Получаем роль пользователя
      const user = await this.userModel.findById(userId).select('role');
      
      // Админы могут присоединиться к любому разговору
      if (user?.role === 'admin') {
        return true;
      }

      // Операторы могут присоединяться к любым беседам (особенно анонимным)
      if (user?.role === 'operator') {
        return true;
      }

      // Проверяем, является ли пользователь участником беседы
      const isParticipant = conversation.participants.some(
        participantId => participantId.toString() === userId
      );

      return isParticipant;
    } catch (error) {
      return false;
    }
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

    // Проверяем, что пользователь участвует в беседе
    const isParticipant = conversation.participants.some(
      participantId => participantId.toString() === senderId
    );

    console.log('Проверка участника беседы:');
    console.log('senderId:', senderId);
    console.log('conversation.participants:', conversation.participants.map(p => p.toString()));
    console.log('isParticipant:', isParticipant);

    if (!isParticipant) {
      throw new ForbiddenException('Вы не являетесь участником этой беседы');
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
      
      const messages = await this.messageModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .sort({ createdAt: -1 }) // Сортируем по убыванию (новые сначала)
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'email profile.username profile.fullName profile.avatarUrl')
        .exec();

      return messages.reverse(); // Возвращаем в хронологическом порядке
    } catch (error) {
      this.logger.error('Error getting conversation messages:', error);
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

    // Помечаем сообщения как прочитанные
    await this.messageModel.updateMany(
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

    // Обнуляем счетчик непрочитанных для этого пользователя
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`unreadByParticipant.${userId}`]: 0 }
    });
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
    
    if (user?.role === 'admin' || user?.role === 'operator') {
      // Админы и операторы видят все разговоры
      query = { status: { $ne: 'DELETED' } };
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
      .populate('lastMessage.senderId', 'profile.username')
      .sort({ updatedAt: -1 })
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
      
      // Находим любого оператора (не обязательно онлайн) - используем тот же фильтр что и в UsersService
      const operators = await this.userModel.find({ 
        role: 'operator',
        isBlocked: false 
      }).limit(1);

      console.log('Найдено операторов:', operators.length);

      if (operators.length === 0) {
        throw new Error('В системе нет зарегистрированных операторов');
      }

      const operator = operators[0];
      console.log('Выбранный оператор:', operator._id);
      
      // Проверяем, есть ли онлайн операторы для определения статуса беседы
      const onlineOperators = await this.userModel.find({ 
        role: 'operator',
        isBlocked: false,
        'profile.isOnline': true
      }).limit(1);
      
      const hasOnlineOperators = onlineOperators.length > 0;
      console.log('Онлайн операторов:', onlineOperators.length);

    // Создаем временного пользователя для анонимной сессии
    const anonymousUser = {
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
      
      const conversation = new this.conversationModel({
        participants: [operator._id], // Только оператор как реальный участник
        type: 'anonymous-support',
        title: createData.title || `Обращение от ${createData.visitorName}`,
        description: 'Анонимная беседа с оператором',
        createdBy: operator._id, // Создана оператором (технически)
        anonymousUser: anonymousUser, // Сохраняем данные анонимного пользователя
        unreadByParticipant: new Map([
          [anonymousUser._id.toString(), 0],
          [operator._id.toString(), 0]
        ]),
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

      // Если нет онлайн операторов, добавляем системное сообщение
      if (!hasOnlineOperators) {
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
      return savedConversation;
      
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
}
