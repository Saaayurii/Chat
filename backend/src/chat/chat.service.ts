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

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
          conversation.participants
            .filter(pid => pid.toString() !== senderId)
            .map(pid => [`unreadByParticipant.${pid}`, 1])
        )
      }
    });

    return savedMessage.populate('senderId', 'email profile.username profile.avatarUrl');
  }

  async getConversationMessages(conversationId: string, userId: string, limit = 50, skip = 0) {
    // Проверяем доступ к беседе
    const canAccess = await this.canUserJoinConversation(userId, conversationId);
    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этой беседе');
    }

    const messages = await this.messageModel
      .find({ conversationId })
      .populate('senderId', 'email profile.username profile.avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    return messages.reverse(); // Возвращаем в хронологическом порядке
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
}
