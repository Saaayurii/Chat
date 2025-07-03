import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument, QuestionStatus, QuestionPriority, QuestionCategory } from '../schemas/question.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class QuestionsSeeder {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding questions...');

    // Проверяем, есть ли уже вопросы
    const existingQuestionsCount = await this.questionModel.countDocuments();
    if (existingQuestionsCount > 0) {
      console.log('❓ Questions already exist, skipping questions seeding');
      return;
    }

    // Получаем пользователей для связывания
    const visitors = await this.userModel.find({ role: UserRole.VISITOR }).limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });
    const admins = await this.userModel.find({ role: UserRole.ADMIN });

    if (visitors.length === 0 || operators.length === 0) {
      console.log('⚠️  No users found, skipping questions seeding');
      return;
    }

    const questions = [
      // Открытые вопросы
      {
        title: 'Не могу войти в личный кабинет',
        description: 'Здравствуйте! У меня проблема с входом в личный кабинет. Ввожу правильный логин и пароль, но система выдает ошибку "Неверные учетные данные". Что делать?',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.OPEN,
        askerId: visitors[0]?._id,
        createdAt: new Date(Date.now() - 1800000), // 30 минут назад
      },
      {
        title: 'Вопрос по тарифам',
        description: 'Подскажите, пожалуйста, какие у вас есть тарифные планы? Интересует корпоративный тариф для 50+ сотрудников.',
        category: QuestionCategory.BILLING,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.OPEN,
        askerId: visitors[1]?._id,
        createdAt: new Date(Date.now() - 3600000), // 1 час назад
      },
      {
        title: 'Срочно! Не работает сервис',
        description: 'У нас критическая ситуация! Сервис недоступен уже 2 часа. Клиенты не могут оформлять заказы. Требуется немедленное решение!',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.URGENT,
        status: QuestionStatus.OPEN,
        askerId: visitors[2]?._id,
        createdAt: new Date(Date.now() - 600000), // 10 минут назад
      },

      // Назначенные вопросы
      {
        title: 'Ошибка при загрузке файлов',
        description: 'При попытке загрузить файл размером более 10 МБ возникает ошибка. Можете ли увеличить лимит или подсказать альтернативное решение?',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.ASSIGNED,
        askerId: visitors[3]?._id,
        assignedOperatorId: operators[0]?._id,
        assignedAt: new Date(Date.now() - 1200000), // 20 минут назад
        createdAt: new Date(Date.now() - 7200000), // 2 часа назад
      },
      {
        title: 'Как изменить контактные данные?',
        description: 'Поменялся номер телефона и email. Как обновить эту информацию в профиле? Инструкция на сайте не помогла.',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.LOW,
        status: QuestionStatus.ASSIGNED,
        askerId: visitors[4]?._id,
        assignedOperatorId: operators[1]?._id,
        assignedAt: new Date(Date.now() - 900000), // 15 минут назад
        createdAt: new Date(Date.now() - 10800000), // 3 часа назад
      },

      // Вопросы в работе
      {
        title: 'Проблема с автоматическим списанием',
        description: 'С карты списалась сумма, но услуга не была оказана. В истории операций вижу списание, но в личном кабинете услуга не отображается.',
        category: QuestionCategory.BILLING,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.IN_PROGRESS,
        askerId: visitors[0]?._id,
        assignedOperatorId: operators[2]?._id,
        assignedAt: new Date(Date.now() - 2700000), // 45 минут назад
        createdAt: new Date(Date.now() - 14400000), // 4 часа назад
      },
      {
        title: 'Интеграция с внешним API',
        description: 'Разрабатываем приложение и хотим интегрироваться с вашим API. Где можно получить документацию и ключи доступа?',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.IN_PROGRESS,
        askerId: visitors[1]?._id,
        assignedOperatorId: operators[3]?._id,
        assignedAt: new Date(Date.now() - 1800000), // 30 минут назад
        createdAt: new Date(Date.now() - 18000000), // 5 часов назад
      },

      // Отвеченные вопросы
      {
        title: 'Как сменить пароль?',
        description: 'Забыл пароль от учетной записи. Функция восстановления не работает - письмо не приходит.',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.ANSWERED,
        askerId: visitors[2]?._id,
        assignedOperatorId: operators[0]?._id,
        assignedAt: new Date(Date.now() - 86400000), // 1 день назад
        answeredAt: new Date(Date.now() - 82800000), // 23 часа назад
        responseTimeMinutes: 60,
        operatorResponse: 'Здравствуйте! Для восстановления пароля попробуйте очистить кэш браузера и проверить папку "Спам". Также отправил вам письмо с инструкцией на backup email.',
        createdAt: new Date(Date.now() - 90000000), // 25 часов назад
      },
      {
        title: 'Вопрос по безопасности данных',
        description: 'Какие меры безопасности вы применяете для защиты персональных данных пользователей? Есть ли сертификаты соответствия?',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.ANSWERED,
        askerId: visitors[3]?._id,
        assignedOperatorId: operators[1]?._id,
        assignedAt: new Date(Date.now() - 172800000), // 2 дня назад
        answeredAt: new Date(Date.now() - 169200000), // 47 часов назад
        responseTimeMinutes: 60,
        operatorResponse: 'Мы используем шифрование данных по стандарту AES-256, имеем сертификат ISO 27001 и регулярно проводим аудит безопасности. Подробная информация в разделе "Политика конфиденциальности".',
        createdAt: new Date(Date.now() - 176400000), // 49 часов назад
      },

      // Закрытые вопросы
      {
        title: 'Настройка уведомлений',
        description: 'Как отключить SMS-уведомления, но оставить email? В настройках не могу найти такую опцию.',
        category: QuestionCategory.GENERAL,
        priority: QuestionPriority.LOW,
        status: QuestionStatus.CLOSED,
        askerId: visitors[4]?._id,
        assignedOperatorId: operators[2]?._id,
        assignedAt: new Date(Date.now() - 259200000), // 3 дня назад
        answeredAt: new Date(Date.now() - 255600000), // 71 час назад
        closedAt: new Date(Date.now() - 252000000), // 70 часов назад
        responseTimeMinutes: 45,
        operatorResponse: 'В настройках профиля есть раздел "Уведомления" -> "Способы доставки". Снимите галочку с SMS, оставьте Email.',
        resolution: 'Пользователь успешно настроил уведомления по предоставленной инструкции.',
        satisfactionRating: 5,
        feedback: 'Спасибо! Все получилось, очень быстро помогли.',
        createdAt: new Date(Date.now() - 262800000), // 73 часа назад
      },
      {
        title: 'Возврат средств',
        description: 'Ошибочно оплатил не тот тариф. Возможен ли возврат средств на карту?',
        category: QuestionCategory.BILLING,
        priority: QuestionPriority.NORMAL,
        status: QuestionStatus.CLOSED,
        askerId: visitors[0]?._id,
        assignedOperatorId: operators[3]?._id,
        assignedAt: new Date(Date.now() - 432000000), // 5 дней назад
        answeredAt: new Date(Date.now() - 428400000), // 119 часов назад
        closedAt: new Date(Date.now() - 345600000), // 96 часов назад
        responseTimeMinutes: 30,
        operatorResponse: 'Возврат возможен в течение 14 дней. Оформил заявку на возврат, средства поступят на карту в течение 5-7 рабочих дней.',
        resolution: 'Возврат обработан, средства возвращены на карту клиента.',
        satisfactionRating: 4,
        feedback: 'Немного долго ждал, но вопрос решили.',
        createdAt: new Date(Date.now() - 435600000), // 121 час назад
      },

      // Переданные вопросы
      {
        title: 'Сложная техническая проблема',
        description: 'При интеграции с вашим API получаю ошибку 500 на endpoint /api/v2/users. В документации этого нет. Логи прилагаю в файле.',
        category: QuestionCategory.TECHNICAL,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.TRANSFERRED,
        askerId: visitors[1]?._id,
        assignedOperatorId: operators[3]?._id, // Текущий оператор
        previousOperatorId: operators[0]?._id, // Предыдущий оператор
        assignedAt: new Date(Date.now() - 7200000), // 2 часа назад
        transferredAt: new Date(Date.now() - 1800000), // 30 минут назад
        transferReason: 'Требуется экспертиза старшего технического специалиста',
        createdAt: new Date(Date.now() - 21600000), // 6 часов назад
      },

      // Жалобы (категория COMPLAINT)
      {
        title: 'Жалоба на работу оператора',
        description: 'Оператор был невежлив и не смог решить мой вопрос. Требую рассмотрения данной ситуации.',
        category: QuestionCategory.COMPLAINT,
        priority: QuestionPriority.HIGH,
        status: QuestionStatus.ASSIGNED,
        askerId: visitors[2]?._id,
        assignedOperatorId: admins[0]?._id, // Жалобы назначаются админам
        assignedAt: new Date(Date.now() - 3600000), // 1 час назад
        createdAt: new Date(Date.now() - 5400000), // 1.5 часа назад
      },

      // Разные временные метки для статистики
      ...Array.from({ length: 5 }, (_, i) => ({
        title: `Тестовый вопрос ${i + 1}`,
        description: `Описание тестового вопроса номер ${i + 1} для заполнения статистики.`,
        category: [QuestionCategory.GENERAL, QuestionCategory.TECHNICAL, QuestionCategory.BILLING][i % 3],
        priority: [QuestionPriority.LOW, QuestionPriority.NORMAL, QuestionPriority.HIGH][i % 3],
        status: [QuestionStatus.CLOSED, QuestionStatus.ANSWERED, QuestionStatus.OPEN][i % 3],
        askerId: visitors[i % visitors.length]?._id,
        assignedOperatorId: operators[i % operators.length]?._id,
        assignedAt: new Date(Date.now() - (86400000 * (i + 1))), // i+1 дней назад
        answeredAt: i < 3 ? new Date(Date.now() - (86400000 * (i + 1)) + 3600000) : undefined,
        closedAt: i === 0 ? new Date(Date.now() - (86400000 * (i + 1)) + 7200000) : undefined,
        responseTimeMinutes: i < 3 ? Math.floor(Math.random() * 120) + 30 : undefined,
        operatorResponse: i < 3 ? `Ответ оператора на вопрос ${i + 1}` : undefined,
        satisfactionRating: i === 0 ? Math.floor(Math.random() * 5) + 1 : undefined,
        createdAt: new Date(Date.now() - (86400000 * (i + 2))), // i+2 дней назад
      })),
    ];

    try {
      const createdQuestions = await this.questionModel.insertMany(questions);
      console.log(`✅ Successfully created ${createdQuestions.length} questions`);
      
      console.log('\n📋 Questions statistics:');
      console.log(`  🆕 Open: ${questions.filter(q => q.status === QuestionStatus.OPEN).length}`);
      console.log(`  👤 Assigned: ${questions.filter(q => q.status === QuestionStatus.ASSIGNED).length}`);
      console.log(`  🔄 In Progress: ${questions.filter(q => q.status === QuestionStatus.IN_PROGRESS).length}`);
      console.log(`  ✅ Answered: ${questions.filter(q => q.status === QuestionStatus.ANSWERED).length}`);
      console.log(`  🏁 Closed: ${questions.filter(q => q.status === QuestionStatus.CLOSED).length}`);
      console.log(`  🔄 Transferred: ${questions.filter(q => q.status === QuestionStatus.TRANSFERRED).length}`);
      
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