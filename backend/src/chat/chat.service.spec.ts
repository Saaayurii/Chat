import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { Message, MessageDocument, MessageType, MessageStatus } from '../database/schemas/message.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto/create-conversation.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { UploadedFile } from '../common/interfaces/uploaded-file.interface';

describe('ChatService', () => {
  let service: ChatService;
  let conversationModel: Model<ConversationDocument>;
  let messageModel: Model<MessageDocument>;
  let userModel: Model<UserDocument>;

  const mockConversationModel = {
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
  };

  const mockMessageModel = {
    find: jest.fn(),
    updateMany: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockConversation = {
    _id: new Types.ObjectId(),
    participants: [new Types.ObjectId(), new Types.ObjectId()],
    type: 'direct',
    title: 'Test Conversation',
    unreadByParticipant: new Map(),
  };

  const mockMessage = {
    _id: new Types.ObjectId(),
    conversationId: new Types.ObjectId(),
    senderId: new Types.ObjectId(),
    text: 'Test message',
    type: MessageType.TEXT,
    status: MessageStatus.SENT,
    readBy: [],
    save: jest.fn(),
    populate: jest.fn(),
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    role: 'visitor',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(Conversation.name),
          useValue: mockConversationModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationModel = module.get<Model<ConversationDocument>>(getModelToken(Conversation.name));
    messageModel = module.get<Model<MessageDocument>>(getModelToken(Message.name));
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canUserJoinConversation', () => {
    const userId = new Types.ObjectId().toString();
    const conversationId = new Types.ObjectId().toString();

    it('should return true for admin users', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: 'admin' }),
      });

      const result = await service.canUserJoinConversation(userId, conversationId);

      expect(result).toBe(true);
    });

    it('should return true for participants', async () => {
      const conversation = {
        ...mockConversation,
        participants: [new Types.ObjectId(userId), new Types.ObjectId()],
      };

      mockConversationModel.findById.mockResolvedValue(conversation);
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: 'visitor' }),
      });

      const result = await service.canUserJoinConversation(userId, conversationId);

      expect(result).toBe(true);
    });

    it('should return false for non-participants', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: 'visitor' }),
      });

      const result = await service.canUserJoinConversation(userId, conversationId);

      expect(result).toBe(false);
    });

    it('should return false when conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      const result = await service.canUserJoinConversation(userId, conversationId);

      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      mockConversationModel.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.canUserJoinConversation(userId, conversationId);

      expect(result).toBe(false);
    });
  });

  describe('createMessage', () => {
    const senderId = new Types.ObjectId().toString();
    const conversationId = new Types.ObjectId().toString();
    const createMessageData: SendMessageDto & { senderId: string } = {
      conversationId,
      senderId,
      text: 'Test message',
      type: MessageType.TEXT,
    };

    it('should create a new message successfully', async () => {
      const conversation = {
        ...mockConversation,
        participants: [new Types.ObjectId(senderId), new Types.ObjectId()],
      };

      mockConversationModel.findById.mockResolvedValue(conversation);
      
      const message = {
        ...mockMessage,
        save: jest.fn().mockResolvedValue(mockMessage),
        populate: jest.fn().mockResolvedValue(mockMessage),
      };

      mockMessageModel.new = jest.fn().mockReturnValue(message);
      mockMessageModel.constructor = jest.fn().mockReturnValue(message);
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(conversation);

      const result = await service.createMessage(createMessageData);

      expect(mockConversationModel.findById).toHaveBeenCalledWith(conversationId);
      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(service.createMessage(createMessageData)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await expect(service.createMessage(createMessageData)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getConversationMessages', () => {
    const conversationId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should return messages when user has access', async () => {
      const messages = [mockMessage, mockMessage];
      
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(true);
      
      mockMessageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(messages),
              }),
            }),
          }),
        }),
      });

      const result = await service.getConversationMessages(conversationId, userId);

      expect(result).toEqual(messages.reverse());
      expect(service.canUserJoinConversation).toHaveBeenCalledWith(userId, conversationId);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(false);

      await expect(service.getConversationMessages(conversationId, userId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should respect limit and skip parameters', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(true);
      
      const limit = 20;
      const skip = 10;
      
      mockMessageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      await service.getConversationMessages(conversationId, userId, limit, skip);

      expect(mockMessageModel.find).toHaveBeenCalledWith({ conversationId });
    });
  });

  describe('markMessagesAsRead', () => {
    const conversationId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should mark messages as read', async () => {
      mockMessageModel.updateMany.mockResolvedValue({ modifiedCount: 5 });
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(mockConversation);

      await service.markMessagesAsRead(conversationId, userId);

      expect(mockMessageModel.updateMany).toHaveBeenCalledWith(
        {
          conversationId: new Types.ObjectId(conversationId),
          senderId: { $ne: new Types.ObjectId(userId) },
          readBy: { $ne: new Types.ObjectId(userId) },
        },
        {
          $addToSet: { readBy: new Types.ObjectId(userId) },
          $set: { [`readTimestamps.${userId}`]: expect.any(Date) },
        }
      );

      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalledWith(conversationId, {
        $set: { [`unreadByParticipant.${userId}`]: 0 },
      });
    });
  });

  describe('createConversation', () => {
    const createData: CreateConversationDto = {
      participantIds: [new Types.ObjectId().toString(), new Types.ObjectId().toString()],
      type: 'direct',
      title: 'Test Conversation',
      description: 'Test description',
      createdBy: new Types.ObjectId().toString(),
    };

    it('should create a new conversation', async () => {
      const conversation = {
        ...mockConversation,
        save: jest.fn().mockResolvedValue(mockConversation),
      };

      mockConversationModel.new = jest.fn().mockReturnValue(conversation);
      mockConversationModel.constructor = jest.fn().mockReturnValue(conversation);

      const result = await service.createConversation(createData);

      expect(result).toEqual(mockConversation);
      expect(conversation.save).toHaveBeenCalled();
    });

    it('should create conversation with related question', async () => {
      const createDataWithQuestion = {
        ...createData,
        relatedQuestionId: new Types.ObjectId().toString(),
      };

      const conversation = {
        ...mockConversation,
        save: jest.fn().mockResolvedValue(mockConversation),
      };

      mockConversationModel.new = jest.fn().mockReturnValue(conversation);
      mockConversationModel.constructor = jest.fn().mockReturnValue(conversation);

      const result = await service.createConversation(createDataWithQuestion);

      expect(result).toEqual(mockConversation);
    });
  });

  describe('getUserConversations', () => {
    const userId = new Types.ObjectId().toString();

    it('should return all conversations for admin', async () => {
      const conversations = [mockConversation];
      
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: 'admin' }),
      });

      mockConversationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(conversations),
            }),
          }),
        }),
      });

      const result = await service.getUserConversations(userId);

      expect(result).toEqual(conversations);
      expect(mockConversationModel.find).toHaveBeenCalledWith({
        status: { $ne: 'DELETED' },
      });
    });

    it('should return only user conversations for regular users', async () => {
      const conversations = [mockConversation];
      
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: 'visitor' }),
      });

      mockConversationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(conversations),
            }),
          }),
        }),
      });

      const result = await service.getUserConversations(userId);

      expect(result).toEqual(conversations);
      expect(mockConversationModel.find).toHaveBeenCalledWith({
        participants: new Types.ObjectId(userId),
        status: { $ne: 'DELETED' },
      });
    });
  });

  describe('getConversation', () => {
    const conversationId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should return conversation when user has access', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(true);
      
      mockConversationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockConversation),
          }),
        }),
      });

      const result = await service.getConversation(conversationId, userId);

      expect(result).toEqual(mockConversation);
      expect(service.canUserJoinConversation).toHaveBeenCalledWith(userId, conversationId);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(false);

      await expect(service.getConversation(conversationId, userId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('uploadAttachment', () => {
    const conversationId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const uploadDto: UploadAttachmentDto = {
      description: 'Test attachment',
    };
    const mockFile: UploadedFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test'),
    };

    it('should upload attachment successfully', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(true);
      jest.spyOn(service as any, 'saveAttachment').mockResolvedValue('/uploads/test.jpg');
      
      const message = {
        ...mockMessage,
        save: jest.fn().mockResolvedValue(mockMessage),
        populate: jest.fn().mockResolvedValue(mockMessage),
      };

      mockMessageModel.new = jest.fn().mockReturnValue(message);
      mockMessageModel.constructor = jest.fn().mockReturnValue(message);

      const result = await service.uploadAttachment(conversationId, userId, mockFile, uploadDto);

      expect(result).toEqual(mockMessage);
      expect(service.canUserJoinConversation).toHaveBeenCalledWith(userId, conversationId);
      expect(service['saveAttachment']).toHaveBeenCalledWith(mockFile, userId);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(false);

      await expect(
        service.uploadAttachment(conversationId, userId, mockFile, uploadDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create image message for image files', async () => {
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(true);
      jest.spyOn(service as any, 'saveAttachment').mockResolvedValue('/uploads/test.jpg');
      
      const message = {
        ...mockMessage,
        type: MessageType.IMAGE,
        save: jest.fn().mockResolvedValue(mockMessage),
        populate: jest.fn().mockResolvedValue(mockMessage),
      };

      mockMessageModel.new = jest.fn().mockReturnValue(message);
      mockMessageModel.constructor = jest.fn().mockReturnValue(message);

      await service.uploadAttachment(conversationId, userId, mockFile, uploadDto);

      expect(mockMessageModel.new).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.IMAGE,
        })
      );
    });

    it('should create file message for non-image files', async () => {
      const textFile = { ...mockFile, mimetype: 'text/plain' };
      
      jest.spyOn(service, 'canUserJoinConversation').mockResolvedValue(true);
      jest.spyOn(service as any, 'saveAttachment').mockResolvedValue('/uploads/test.txt');
      
      const message = {
        ...mockMessage,
        type: MessageType.FILE,
        save: jest.fn().mockResolvedValue(mockMessage),
        populate: jest.fn().mockResolvedValue(mockMessage),
      };

      mockMessageModel.new = jest.fn().mockReturnValue(message);
      mockMessageModel.constructor = jest.fn().mockReturnValue(message);

      await service.uploadAttachment(conversationId, userId, textFile, uploadDto);

      expect(mockMessageModel.new).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.FILE,
        })
      );
    });
  });

  describe('saveAttachment', () => {
    const userId = new Types.ObjectId().toString();
    const mockFile: UploadedFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test'),
    };

    it('should return file path', async () => {
      const result = await service['saveAttachment'](mockFile, userId);

      expect(result).toContain('/uploads/attachments/');
      expect(result).toContain(userId);
      expect(result).toContain('test.jpg');
    });
  });
});
