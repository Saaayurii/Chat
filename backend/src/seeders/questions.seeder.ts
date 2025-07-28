import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionStatus,
  QuestionPriority,
  QuestionCategory,
} from '../database/schemas/question.schema';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

@Injectable()
export class QuestionsSeeder {
  constructor(
    @InjectModel(Question.name)
    private questionModel: Model<QuestionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding questions...');

    const existingQuestionsCount = await this.questionModel.countDocuments();
    if (existingQuestionsCount > 0) {
      console.log('❓ Questions already exist, skipping questions seeding');
      return;
    }

    const visitors = await this.userModel
      .find({ role: UserRole.VISITOR })
      .limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });
    const admins = await this.userModel.find({ role: UserRole.ADMIN });
    if (visitors.length < 5 || operators.length < 4 || admins.length < 1) {
      console.error(
        `❌ Not enough users to seed questions.\nFound: ${visitors.length} visitors, ${operators.length} operators, ${admins.length} admins`,
      );
      return;
    }
    if (visitors.length === 0 || operators.length === 0) {
      console.log('⚠️  No users found, skipping questions seeding');
      return;
    }

    const questions = [
      {
        text: 'Не могу войти в личный кабинет. Ввожу правильный логин и пароль, но система выдает ошибку "Неверные учетные данные". Что делать?',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.OPEN,
        visitorId: visitors[0].id,
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        text: 'Подскажите, пожалуйста, какие у вас есть тарифные планы? Интересует корпоративный тариф для 50+ сотрудников.',
        category: QuestionCategory.BILLING,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.OPEN,
        visitorId: visitors[1].id,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        text: 'Срочно! Не работает сервис. У нас критическая ситуация! Сервис недоступен уже 2 часа. Клиенты не могут оформлять заказы.',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.URGENT,
        status: QuestionStatus.OPEN,
        visitorId: visitors[2].id,
        createdAt: new Date(Date.now() - 600000),
      },
      {
        text: 'Ошибка при загрузке файлов. При попытке загрузить файл размером более 10 МБ возникает ошибка.',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.ASSIGNED,
        visitorId: visitors[3].id,
        operatorId: operators[0].id,
        assignedAt: new Date(Date.now() - 1200000),
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        text: 'Как изменить контактные данные? Поменялся номер телефона и email.',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.LOW,
        status: QuestionStatus.ASSIGNED,
        visitorId: visitors[4].id,
        operatorId: operators[1].id,
        assignedAt: new Date(Date.now() - 900000),
        createdAt: new Date(Date.now() - 10800000),
      },
      {
        text: 'С карты списалась сумма, но услуга не была оказана.',
        category: QuestionCategory.BILLING,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.IN_PROGRESS,
        visitorId: visitors[0].id,
        operatorId: operators[2].id,
        assignedAt: new Date(Date.now() - 2700000),
        createdAt: new Date(Date.now() - 14400000),
      },
      {
        text: 'Интеграция с внешним API. Разрабатываем приложение и хотим интегрироваться с вашим API.',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.IN_PROGRESS,
        visitorId: visitors[1].id,
        operatorId: operators[3].id,
        assignedAt: new Date(Date.now() - 1800000),
        createdAt: new Date(Date.now() - 18000000),
      },
      {
        text: 'Как сменить пароль? Забыл пароль от учетной записи. Функция восстановления не работает.',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.ANSWERED,
        visitorId: visitors[2].id,
        operatorId: operators[0].id,
        assignedAt: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 90000000),
      },
      {
        text: 'Какие меры безопасности вы применяете для защиты персональных данных пользователей?',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.ANSWERED,
        visitorId: visitors[3].id,
        operatorId: operators[1].id,
        assignedAt: new Date(Date.now() - 172800000),
        createdAt: new Date(Date.now() - 176400000),
      },
      {
        text: 'Как отключить SMS-уведомления, но оставить email?',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.LOW,
        status: QuestionStatus.CLOSED,
        visitorId: visitors[4].id,
        operatorId: operators[2].id,
        assignedAt: new Date(Date.now() - 259200000),
        createdAt: new Date(Date.now() - 262800000),
      },
      {
        text: 'Ошибочно оплатил не тот тариф. Возможен ли возврат средств?',
        category: QuestionCategory.BILLING,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.CLOSED,
        visitorId: visitors[0].id,
        operatorId: operators[3].id,
        assignedAt: new Date(Date.now() - 432000000),
        createdAt: new Date(Date.now() - 435600000),
      },
      {
        text: 'При интеграции с вашим API получаю ошибку 500. В документации этого нет.',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.TRANSFERRED,
        visitorId: visitors[1].id,
        operatorId: operators[3].id,
        assignedAt: new Date(Date.now() - 7200000),
        createdAt: new Date(Date.now() - 21600000),
      },
      {
        text: 'Оператор был невежлив и не смог решить мой вопрос. Требую рассмотрения.',
        category: QuestionCategory.COMPLAINT,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.ASSIGNED,
        visitorId: visitors[2].id,
        operatorId: admins[0].id,
        assignedAt: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 5400000),
      },
      ...Array.from({ length: 5 }, (_, i) => ({
        text: `Тестовый вопрос ${i + 1}. Описание тестового вопроса.`,
        category: [
          QuestionCategory.GENERAL,
          QuestionCategory.TECHNICAL,
          QuestionCategory.BILLING,
        ][i % 3],
        priority: [
          QuestionPriority.LOW,
          QuestionPriority.NORMAL,
          QuestionPriority.HIGH,
        ][i % 3],
        status: [
          QuestionStatus.CLOSED,
          QuestionStatus.ANSWERED,
          QuestionStatus.OPEN,
        ][i % 3],
        visitorId: visitors[i % visitors.length].id,
        operatorId: operators[i % operators.length].id,
        assignedAt: new Date(Date.now() - 86400000 * (i + 1)),
        createdAt: new Date(Date.now() - 86400000 * (i + 2)),
      })),
    ];

    try {
      const created = await this.questionModel.insertMany(questions);
      console.log(`✅ Successfully inserted ${created.length} questions`);
    } catch (error) {
      console.error('❌ Error seeding questions:', error);
      throw error;
    }
  }

  async clear() {
    console.log('🧹 Clearing questions collection...');
    await this.questionModel.deleteMany({});
    console.log('✅ Questions collection cleared');
  }
}
