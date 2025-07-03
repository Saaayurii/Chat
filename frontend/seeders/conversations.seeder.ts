import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument, ConversationType, ConversationStatus } from '../schemas/conversation.schema';
import { Message, MessageDocument, MessageType, MessageStatus } from '../schemas/message.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class ConversationsSeeder {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding conversations and messages...');

    // Проверяем, есть ли уже разговоры
    const existingConversationsCount = await this.conversationModel.countDocuments();
    if (existingConversationsCount > 0) {
      console.log('💬 Conversations already exist, skipping conversations seeding');
      return;
    }

    // Получаем пользователей
    const visitors = await this.userModel.find({ role: UserRole.VISITOR }).limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });
    const admins = await this.userModel.find({ role: UserRole.ADMIN });

    if (visitors.length === 0 || operators.length === 0) {
      console.log('⚠️  No users found, skipping conversations seeding');
      return;
    }

    const conversations: any[] = [];
    const messages: any[] = [];

    // Типовые сообщения для разных сценариев
    const greetings = [
      'Здравствуйте! Как дела?',
      'Добрый день! Могу ли я вам помочь?',
      'Привет! У меня есть вопрос.',
      'Здравствуйте! Нужна помощь.'
    ];

    const techQuestions = [
      'Не могу войти в личный кабинет, что делать?',
      'У меня проблемы с загрузкой файлов',
      'Сайт работает очень медленно',
      'Ошибка при оплате картой'
    ];

    const operatorResponses = [
      'Здравствуйте! Сейчас помогу разобраться с вашим вопросом.',
      'Давайте решим эту проблему. Можете описать подробнее?',
      'Понял вашу проблему. Попробуйте сделать следующее...',
      'Проверил с нашей стороны. Попробуйте обновить страницу.'
    ];

    const solutions = [
      'Попробуйте очистить кэш браузера и войти снова.',
      'Проблема решена с нашей стороны. Теперь все должно работать.',
      'Отправил вам инструкцию на email. Проверьте, пожалуйста.',
      'Обновление завершено. Перезагрузите страницу.'
    ];

    const thankYous = [
      'Спасибо большое! Все заработало!',
      'Отлично, проблема решена. Спасибо за помощь!',
      'Супер! Теперь все понятно.',
      'Благодарю за быструю помощь!'
    ];

    // 1. Активные разговоры (пользователь-оператор)
    for (let i = 0; i < 5; i++) {
      const visitor = visitors[i % visitors.length];
      const operator = operators[i % operators.length];
      const conversationId = new Date().getTime() + i;

      const conversation = {
        _id: conversationId,
        participants: [visitor._id, operator._id],
        type: ConversationType.USER_OPERATOR,
        status: ConversationStatus.ACTIVE,
        createdBy: visitor._id,
        lastMessage: {
          text: operatorResponses[i % operatorResponses.length],
          senderId: operator._id,
          timestamp: new Date(Date.now() - 300000 + i * 60000), // 5 минут назад, с интервалом
        },
        unreadMessagesCount: Math.floor(Math.random() * 3),
        unreadByParticipant: new Map([
          [visitor._id.toString(), Math.floor(Math.random() * 2)],
          [operator._id.toString(), 0]
        ]),
        createdAt: new Date(Date.now() - 3600000 + i * 600000), // час назад, с интервалами
        updatedAt: new Date(Date.now() - 300000 + i * 60000),
      };

      conversations.push(conversation);

      // Создаем сообщения для этого разговора
      const conversationMessages = [
        {
          conversationId,
          senderId: visitor._id,
          text: greetings[i % greetings.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 3600000 + i * 600000)],
            [operator._id.toString(), new Date(Date.now() - 3540000 + i * 600000)]
          ]),
          createdAt: new Date(Date.now() - 3600000 + i * 600000),
        },
        {
          conversationId,
          senderId: visitor._id,
          text: techQuestions[i % techQuestions.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 3540000 + i * 600000)],
            [operator._id.toString(), new Date(Date.now() - 3480000 + i * 600000)]
          ]),
          createdAt: new Date(Date.now() - 3540000 + i * 600000),
        },
        {
          conversationId,
          senderId: operator._id,
          text: operatorResponses[i % operatorResponses.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [operator._id.toString(), new Date(Date.now() - 3480000 + i * 600000)],
            [visitor._id.toString(), new Date(Date.now() - 300000 + i * 60000)]
          ]),
          createdAt: new Date(Date.now() - 300000 + i * 60000),
        }
      ];

      messages.push(...conversationMessages);
    }

    // 2. Завершенные разговоры
    for (let i = 0; i < 8; i++) {
      const visitor = visitors[i % visitors.length];
      const operator = operators[i % operators.length];
      const conversationId = new Date().getTime() + 1000 + i;

      const conversation = {
        _id: conversationId,
        participants: [visitor._id, operator._id],
        type: ConversationType.USER_OPERATOR,
        status: ConversationStatus.CLOSED,
        createdBy: visitor._id,
        closedAt: new Date(Date.now() - 86400000 + i * 10800000), // от 1 дня до нескольких часов назад
        closureReason: 'Вопрос решен',
        lastMessage: {
          text: thankYous[i % thankYous.length],
          senderId: visitor._id,
          timestamp: new Date(Date.now() - 86400000 + i * 10800000),
        },
        unreadMessagesCount: 0,
        unreadByParticipant: new Map([
          [visitor._id.toString(), 0],
          [operator._id.toString(), 0]
        ]),
        createdAt: new Date(Date.now() - 90000000 + i * 10800000), // около дня назад
        updatedAt: new Date(Date.now() - 86400000 + i * 10800000),
      };

      conversations.push(conversation);

      // Полный диалог для завершенного разговора
      const conversationMessages = [
        {
          conversationId,
          senderId: visitor._id,
          text: greetings[i % greetings.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 90000000 + i * 10800000)],
            [operator._id.toString(), new Date(Date.now() - 89940000 + i * 10800000)]
          ]),
          createdAt: new Date(Date.now() - 90000000 + i * 10800000),
        },
        {
          conversationId,
          senderId: visitor._id,
          text: techQuestions[i % techQuestions.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 89940000 + i * 10800000)],
            [operator._id.toString(), new Date(Date.now() - 89880000 + i * 10800000)]
          ]),
          createdAt: new Date(Date.now() - 89940000 + i * 10800000),
        },
        {
          conversationId,
          senderId: operator._id,
          text: operatorResponses[i % operatorResponses.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [operator._id.toString(), new Date(Date.now() - 89880000 + i * 10800000)],
            [visitor._id.toString(), new Date(Date.now() - 89820000 + i * 10800000)]
          ]),
          createdAt: new Date(Date.now() - 89880000 + i * 10800000),
        },
        {
          conversationId,
          senderId: operator._id,
          text: solutions[i % solutions.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [operator._id.toString(), new Date(Date.now() - 89820000 + i * 10800000)],
            [visitor._id.toString(), new Date(Date.now() - 86460000 + i * 10800000)]
          ]),
          createdAt: new Date(Date.now() - 89820000 + i * 10800000),
        },
        {
          conversationId,
          senderId: visitor._id,
          text: thankYous[i % thankYous.length],
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 86460000 + i * 10800000)],
            [operator._id.toString(), new Date(Date.now() - 86400000 + i * 10800000)]
          ]),
          createdAt: new Date(Date.now() - 86460000 + i * 10800000),
        }
      ];

      messages.push(...conversationMessages);
    }

    // 3. Разговоры между операторами
    for (let i = 0; i < 3; i++) {
      const operator1 = operators[i % operators.length];
      const operator2 = operators[(i + 1) % operators.length];
      const conversationId = new Date().getTime() + 2000 + i;

      const conversation = {
        _id: conversationId,
        participants: [operator1._id, operator2._id],
        type: ConversationType.OPERATOR_OPERATOR,
        status: ConversationStatus.ACTIVE,
        createdBy: operator1._id,
        title: `Консультация по клиенту #${1000 + i}`,
        lastMessage: {
          text: 'Понял, спасибо за разъяснение!',
          senderId: operator1._id,
          timestamp: new Date(Date.now() - 1800000 + i * 300000),
        },
        unreadMessagesCount: 0,
        unreadByParticipant: new Map([
          [operator1._id.toString(), 0],
          [operator2._id.toString(), 0]
        ]),
        createdAt: new Date(Date.now() - 7200000 + i * 1800000),
        updatedAt: new Date(Date.now() - 1800000 + i * 300000),
      };

      conversations.push(conversation);

      const conversationMessages = [
        {
          conversationId,
          senderId: operator1._id,
          text: `Привет! Можешь помочь с клиентом? У него сложный технический вопрос.`,
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [operator1._id, operator2._id],
          readTimestamps: new Map([
            [operator1._id.toString(), new Date(Date.now() - 7200000 + i * 1800000)],
            [operator2._id.toString(), new Date(Date.now() - 7140000 + i * 1800000)]
          ]),
          createdAt: new Date(Date.now() - 7200000 + i * 1800000),
        },
        {
          conversationId,
          senderId: operator2._id,
          text: 'Конечно! Расскажи подробнее, что именно не работает?',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [operator1._id, operator2._id],
          readTimestamps: new Map([
            [operator2._id.toString(), new Date(Date.now() - 7140000 + i * 1800000)],
            [operator1._id.toString(), new Date(Date.now() - 1860000 + i * 300000)]
          ]),
          createdAt: new Date(Date.now() - 7140000 + i * 1800000),
        },
        {
          conversationId,
          senderId: operator1._id,
          text: 'Понял, спасибо за разъяснение!',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [operator1._id, operator2._id],
          readTimestamps: new Map([
            [operator1._id.toString(), new Date(Date.now() - 1800000 + i * 300000)],
            [operator2._id.toString(), new Date(Date.now() - 1800000 + i * 300000)]
          ]),
          createdAt: new Date(Date.now() - 1800000 + i * 300000),
        }
      ];

      messages.push(...conversationMessages);
    }

    // 4. Разговоры с администраторами
    for (let i = 0; i < 2; i++) {
      const operator = operators[i % operators.length];
      const admin = admins[i % admins.length];
      const conversationId = new Date().getTime() + 3000 + i;

      const conversation = {
        _id: conversationId,
        participants: [operator._id, admin._id],
        type: ConversationType.OPERATOR_ADMIN,
        status: ConversationStatus.ACTIVE,
        createdBy: operator._id,
        title: 'Сложный случай - требуется эскалация',
        lastMessage: {
          text: 'Хорошо, займусь этим вопросом.',
          senderId: admin._id,
          timestamp: new Date(Date.now() - 900000 + i * 300000),
        },
        unreadMessagesCount: 0,
        unreadByParticipant: new Map([
          [operator._id.toString(), 0],
          [admin._id.toString(), 0]
        ]),
        createdAt: new Date(Date.now() - 3600000 + i * 900000),
        updatedAt: new Date(Date.now() - 900000 + i * 300000),
      };

      conversations.push(conversation);

      const conversationMessages = [
        {
          conversationId,
          senderId: operator._id,
          text: 'Нужна помощь с эскалацией. Клиент требует возврат, но случай спорный.',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [operator._id, admin._id],
          readTimestamps: new Map([
            [operator._id.toString(), new Date(Date.now() - 3600000 + i * 900000)],
            [admin._id.toString(), new Date(Date.now() - 3540000 + i * 900000)]
          ]),
          createdAt: new Date(Date.now() - 3600000 + i * 900000),
        },
        {
          conversationId,
          senderId: admin._id,
          text: 'Отправь мне детали случая. Рассмотрю и дам решение.',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [operator._id, admin._id],
          readTimestamps: new Map([
            [admin._id.toString(), new Date(Date.now() - 3540000 + i * 900000)],
            [operator._id.toString(), new Date(Date.now() - 960000 + i * 300000)]
          ]),
          createdAt: new Date(Date.now() - 3540000 + i * 900000),
        },
        {
          conversationId,
          senderId: admin._id,
          text: 'Хорошо, займусь этим вопросом.',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [operator._id, admin._id],
          readTimestamps: new Map([
            [admin._id.toString(), new Date(Date.now() - 900000 + i * 300000)],
            [operator._id.toString(), new Date(Date.now() - 900000 + i * 300000)]
          ]),
          createdAt: new Date(Date.now() - 900000 + i * 300000),
        }
      ];

      messages.push(...conversationMessages);
    }

    // 5. Архивные разговоры (старые)
    for (let i = 0; i < 5; i++) {
      const visitor = visitors[i % visitors.length];
      const operator = operators[i % operators.length];
      const conversationId = new Date().getTime() + 4000 + i;

      const conversation = {
        _id: conversationId,
        participants: [visitor._id, operator._id],
        type: ConversationType.USER_OPERATOR,
        status: ConversationStatus.CLOSED,
        createdBy: visitor._id,
        closedAt: new Date(Date.now() - 604800000 - i * 86400000), // неделя+ назад
        archivedAt: new Date(Date.now() - 604800000 - i * 86400000 + 3600000),
        closureReason: 'Автоматическое архивирование',
        lastMessage: {
          text: 'Проблема решена, спасибо!',
          senderId: visitor._id,
          timestamp: new Date(Date.now() - 604800000 - i * 86400000),
        },
        unreadMessagesCount: 0,
        unreadByParticipant: new Map([
          [visitor._id.toString(), 0],
          [operator._id.toString(), 0]
        ]),
        createdAt: new Date(Date.now() - 608400000 - i * 86400000),
        updatedAt: new Date(Date.now() - 604800000 - i * 86400000),
      };

      conversations.push(conversation);

      // Простой диалог для архивного разговора
      const conversationMessages = [
        {
          conversationId,
          senderId: visitor._id,
          text: 'Здравствуйте! Нужна помощь.',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 608400000 - i * 86400000)],
            [operator._id.toString(), new Date(Date.now() - 608340000 - i * 86400000)]
          ]),
          createdAt: new Date(Date.now() - 608400000 - i * 86400000),
        },
        {
          conversationId,
          senderId: operator._id,
          text: 'Добро пожаловать! Чем могу помочь?',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [operator._id.toString(), new Date(Date.now() - 608340000 - i * 86400000)],
            [visitor._id.toString(), new Date(Date.now() - 604860000 - i * 86400000)]
          ]),
          createdAt: new Date(Date.now() - 608340000 - i * 86400000),
        },
        {
          conversationId,
          senderId: visitor._id,
          text: 'Проблема решена, спасибо!',
          type: MessageType.TEXT,
          status: MessageStatus.DELIVERED,
          readBy: [visitor._id, operator._id],
          readTimestamps: new Map([
            [visitor._id.toString(), new Date(Date.now() - 604800000 - i * 86400000)],
            [operator._id.toString(), new Date(Date.now() - 604800000 - i * 86400000)]
          ]),
          createdAt: new Date(Date.now() - 604800000 - i * 86400000),
        }
      ];

      messages.push(...conversationMessages);
    }

    try {
      // Сначала создаем разговоры
      const createdConversations = await this.conversationModel.insertMany(conversations);
      console.log(`✅ Successfully created ${createdConversations.length} conversations`);

      // Затем создаем сообщения
      const createdMessages = await this.messageModel.insertMany(messages);
      console.log(`✅ Successfully created ${createdMessages.length} messages`);

      console.log('\n📋 Conversations statistics:');
      console.log(`  🟢 Active: ${conversations.filter(c => c.status === ConversationStatus.ACTIVE).length}`);
      console.log(`  🔒 Closed: ${conversations.filter(c => c.status === ConversationStatus.CLOSED).length}`);
      console.log(`  📁 Closed (Archived): ${conversations.filter(c => c.archivedAt).length}`);

      console.log('\n📊 By type:');
      console.log(`  👤↔️👨‍💼 User-Operator: ${conversations.filter(c => c.type === ConversationType.USER_OPERATOR).length}`);
      console.log(`  👨‍💼↔️👨‍💼 Operator-Operator: ${conversations.filter(c => c.type === ConversationType.OPERATOR_OPERATOR).length}`);
      console.log(`  👨‍💼↔️👑 Operator-Admin: ${conversations.filter(c => c.type === ConversationType.OPERATOR_ADMIN).length}`);

      console.log(`\n💬 Total messages: ${messages.length}`);
      console.log(`📊 Average messages per conversation: ${(messages.length / conversations.length).toFixed(1)}`);

    } catch (error) {
      console.error('❌ Error seeding conversations and messages:', error);
      throw error;
    }
  }

  async clear() {
    console.log('🧹 Clearing conversations and messages...');
    await this.messageModel.deleteMany({});
    await this.conversationModel.deleteMany({});
    console.log('✅ Conversations and messages cleared');
  }
}