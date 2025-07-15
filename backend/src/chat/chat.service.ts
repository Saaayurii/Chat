import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { Message, MessageDocument, MessageType, MessageStatus } from '../database/schemas/message.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto/create-conversation.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { UploadedFile } from '../common/interfaces/uploaded-file.interface';
import { MessageCacheService } from '../common/services/message-cache.service';
import { NotificationService } from '../common/services/notification.service';
import { RateLimitService } from '../common/services/rate-limit.service';
import { RedisService } from '../common/services/redis.service';

@Injectable()
export class ChatService {
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

    // Добавляем сообщение в кэш Redis
    await this.messageCacheService.addMessage(savedMessage);

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

  async getConversationMessages(conversationId: string, userId: string, limit = 50, skip = 0) {
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
        const messages = await this.messageModel
          .find({ conversationId: convId })
          .populate('senderId', 'email profile.username profile.avatarUrl')
          .sort({ createdAt: -1 })
          .limit(lmt)
          .skip(skp)
          .exec();

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
    
    if (user?.role === 'admin') {
      // Админы видят все разговоры
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
}
