import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Complaint, ComplaintDocument, ComplaintStatus, ComplaintType, ComplaintSeverity } from '../schemas/complaint.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class ComplaintsSeeder {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<ComplaintDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding complaints...');

    // Проверяем, есть ли уже жалобы
    const existingComplaintsCount = await this.complaintModel.countDocuments();
    if (existingComplaintsCount > 0) {
      console.log('😤 Complaints already exist, skipping complaints seeding');
      return;
    }

    // Получаем пользователей
    const visitors = await this.userModel.find({ role: UserRole.VISITOR }).limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });
    const admins = await this.userModel.find({ role: UserRole.ADMIN });

    if (visitors.length === 0 || operators.length === 0 || admins.length === 0) {
      console.log('⚠️  No users found, skipping complaints seeding');
      return;
    }

    const complaints = [
      // Новые жалобы
      {
        title: 'Грубость оператора',
        description: 'Оператор Мария была крайне невежлива, повышала голос и не хотела помочь с решением проблемы. Требую принять меры.',
        type: ComplaintType.OPERATOR_BEHAVIOR,
        severity: ComplaintSeverity.HIGH,
        status: ComplaintStatus.PENDING,
        complainantId: visitors[0]?._id,
        targetOperatorId: operators[0]?._id, // Мария
        createdAt: new Date(Date.now() - 1800000), // 30 минут назад
      },
      {
        title: 'Долгое время ответа',
        description: 'Ждал ответа от оператора более 2 часов. Это неприемлемо для срочного вопроса. Время ответа должно быть сокращено.',
        type: ComplaintType.RESPONSE_TIME,
        severity: ComplaintSeverity.MEDIUM,
        status: ComplaintStatus.PENDING,
        complainantId: visitors[1]?._id,
        targetOperatorId: operators[1]?._id, // Денис
        createdAt: new Date(Date.now() - 3600000), // 1 час назад
      },
      {
        title: 'Некомпетентность специалиста',
        description: 'Оператор не смог решить техническую проблему, давал неверные советы, из-за которых ситуация только ухудшилась.',
        type: ComplaintType.OPERATOR_COMPETENCE,
        severity: ComplaintSeverity.HIGH,
        status: ComplaintStatus.PENDING,
        complainantId: visitors[2]?._id,
        targetOperatorId: operators[2]?._id, // Анна
        createdAt: new Date(Date.now() - 7200000), // 2 часа назад
      },

      // Рассматриваемые жалобы
      {
        title: 'Неудовлетворительное качество обслуживания',
        description: 'В целом не доволен качеством обслуживания. Операторы не всегда в курсе актуальной информации о тарифах и услугах.',
        type: ComplaintType.SERVICE_QUALITY,
        severity: ComplaintSeverity.MEDIUM,
        status: ComplaintStatus.IN_REVIEW,
        complainantId: visitors[3]?._id,
        targetOperatorId: operators[3]?._id, // Павел
        reviewerId: admins[0]?._id,
        assignedAt: new Date(Date.now() - 1800000), // 30 минут назад
        createdAt: new Date(Date.now() - 14400000), // 4 часа назад
      },
      {
        title: 'Нарушение конфиденциальности',
        description: 'Оператор обсуждал мои персональные данные при других сотрудниках. Это недопустимо!',
        type: ComplaintType.PRIVACY_VIOLATION,
        severity: ComplaintSeverity.CRITICAL,
        status: ComplaintStatus.IN_REVIEW,
        complainantId: visitors[4]?._id,
        targetOperatorId: operators[0]?._id,
        reviewerId: admins[1]?._id,
        assignedAt: new Date(Date.now() - 3600000), // 1 час назад
        createdAt: new Date(Date.now() - 18000000), // 5 часов назад
      },

      // Решенные жалобы
      {
        title: 'Неправильная информация о тарифе',
        description: 'Оператор предоставил неверную информацию о стоимости тарифа, из-за чего я понес дополнительные расходы.',
        type: ComplaintType.MISINFORMATION,
        severity: ComplaintSeverity.HIGH,
        status: ComplaintStatus.RESOLVED,
        complainantId: visitors[0]?._id,
        targetOperatorId: operators[1]?._id,
        reviewerId: admins[0]?._id,
        assignedAt: new Date(Date.now() - 172800000), // 2 дня назад
        resolvedAt: new Date(Date.now() - 86400000), // 1 день назад
        resolution: 'Проведена дополнительная подготовка оператора по тарифным планам. Клиенту возмещена разница в стоимости.',
        compensationOffered: 'Возврат переплаты 500 рублей',
        adminNotes: 'Оператор прошел дополнительное обучение. Обновлена база знаний по тарифам.',
        createdAt: new Date(Date.now() - 259200000), // 3 дня назад
      },
      {
        title: 'Прерывание звонка',
        description: 'Оператор несколько раз прерывал звонок во время консультации. Очень раздражает такое отношение.',
        type: ComplaintType.OPERATOR_BEHAVIOR,
        severity: ComplaintSeverity.MEDIUM,
        status: ComplaintStatus.RESOLVED,
        complainantId: visitors[1]?._id,
        targetOperatorId: operators[2]?._id,
        reviewerId: admins[1]?._id,
        assignedAt: new Date(Date.now() - 345600000), // 4 дня назад
        resolvedAt: new Date(Date.now() - 259200000), // 3 дня назад
        resolution: 'Выявлена техническая проблема с телефонной линией. Проблема устранена, оператор получил предупреждение о необходимости уведомлять клиентов о технических сбоях.',
        compensationOffered: 'Бесплатная консультация специалиста',
        adminNotes: 'Техническая проблема устранена. Оператор проинструктирован.',
        createdAt: new Date(Date.now() - 432000000), // 5 дней назад
      },

      // Отклоненные жалобы
      {
        title: 'Требование незаконных услуг',
        description: 'Оператор отказался выполнить мою просьбу, хотя я клиент!',
        type: ComplaintType.SERVICE_QUALITY,
        severity: ComplaintSeverity.LOW,
        status: ComplaintStatus.REJECTED,
        complainantId: visitors[2]?._id,
        targetOperatorId: operators[3]?._id,
        reviewerId: admins[0]?._id,
        assignedAt: new Date(Date.now() - 518400000), // 6 дней назад
        resolvedAt: new Date(Date.now() - 432000000), // 5 дней назад
        resolution: 'После расследования выяснилось, что клиент требовал предоставить персональные данные других пользователей, что противоречит политике конфиденциальности. Действия оператора правомерны.',
        adminNotes: 'Жалоба необоснованна. Оператор действовал согласно регламенту.',
        createdAt: new Date(Date.now() - 604800000), // 7 дней назад
      },
      {
        title: 'Несогласие с решением',
        description: 'Не согласен с решением по предыдущему обращению. Считаю его несправедливым.',
        type: ComplaintType.SERVICE_QUALITY,
        severity: ComplaintSeverity.LOW,
        status: ComplaintStatus.REJECTED,
        complainantId: visitors[3]?._id,
        targetOperatorId: operators[0]?._id,
        reviewerId: admins[1]?._id,
        assignedAt: new Date(Date.now() - 691200000), // 8 дней назад
        resolvedAt: new Date(Date.now() - 604800000), // 7 дней назад
        resolution: 'Повторное рассмотрение подтвердило правильность первоначального решения. Все действия сотрудников соответствовали регламенту.',
        adminNotes: 'Повторная жалоба на то же обращение. Первоначальное решение подтверждено.',
        createdAt: new Date(Date.now() - 777600000), // 9 дней назад
      },

      // Эскалированные жалобы
      {
        title: 'Дискриминация по возрасту',
        description: 'Оператор несколько раз подчеркнул мой возраст и намекнул, что пожилые люди не разбираются в технологиях. Это дискриминация!',
        type: ComplaintType.DISCRIMINATION,
        severity: ComplaintSeverity.CRITICAL,
        status: ComplaintStatus.ESCALATED,
        complainantId: visitors[4]?._id,
        targetOperatorId: operators[1]?._id,
        reviewerId: admins[0]?._id,
        assignedAt: new Date(Date.now() - 86400000), // 1 день назад
        escalatedAt: new Date(Date.now() - 43200000), // 12 часов назад
        escalationReason: 'Вопрос дискриминации требует рассмотрения на высшем уровне руководства',
        adminNotes: 'Серьезное обвинение. Требуется детальное расследование и возможные дисциплинарные меры.',
        createdAt: new Date(Date.now() - 172800000), // 2 дня назад
      },

      // Статистические данные для тестирования
      ...Array.from({ length: 10 }, (_, i) => ({
        title: `Жалоба ${i + 1}`,
        description: `Описание жалобы номер ${i + 1} для статистики.`,
        type: [
          ComplaintType.OPERATOR_BEHAVIOR,
          ComplaintType.RESPONSE_TIME,
          ComplaintType.SERVICE_QUALITY,
          ComplaintType.OPERATOR_COMPETENCE,
          ComplaintType.MISINFORMATION
        ][i % 5],
        severity: [
          ComplaintSeverity.LOW,
          ComplaintSeverity.MEDIUM,
          ComplaintSeverity.HIGH,
          ComplaintSeverity.CRITICAL
        ][i % 4],
        status: [
          ComplaintStatus.RESOLVED,
          ComplaintStatus.REJECTED,
          ComplaintStatus.PENDING
        ][i % 3],
        complainantId: visitors[i % visitors.length]?._id,
        targetOperatorId: operators[i % operators.length]?._id,
        reviewerId: i % 3 !== 2 ? admins[i % admins.length]?._id : undefined,
        assignedAt: i % 3 !== 2 ? new Date(Date.now() - (86400000 * (i + 1))) : undefined,
        resolvedAt: i % 3 === 0 ? new Date(Date.now() - (86400000 * i) + 3600000) : undefined,
        resolution: i % 3 === 0 ? `Решение по жалобе ${i + 1}` : undefined,
        createdAt: new Date(Date.now() - (86400000 * (i + 2))),
      })),
    ];

    try {
      const createdComplaints = await this.complaintModel.insertMany(complaints);
      console.log(`✅ Successfully created ${createdComplaints.length} complaints`);
      
      console.log('\n📋 Complaints statistics:');
      console.log(`  ⏳ Pending: ${complaints.filter(c => c.status === ComplaintStatus.PENDING).length}`);
      console.log(`  👀 In Review: ${complaints.filter(c => c.status === ComplaintStatus.IN_REVIEW).length}`);
      console.log(`  ✅ Resolved: ${complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length}`);
      console.log(`  ❌ Rejected: ${complaints.filter(c => c.status === ComplaintStatus.REJECTED).length}`);
      console.log(`  ⬆️ Escalated: ${complaints.filter(c => c.status === ComplaintStatus.ESCALATED).length}`);
      
      console.log('\n📊 By severity:');
      console.log(`  🔴 Critical: ${complaints.filter(c => c.severity === ComplaintSeverity.CRITICAL).length}`);
      console.log(`  🟠 High: ${complaints.filter(c => c.severity === ComplaintSeverity.HIGH).length}`);
      console.log(`  🟡 Medium: ${complaints.filter(c => c.severity === ComplaintSeverity.MEDIUM).length}`);
      console.log(`  🟢 Low: ${complaints.filter(c => c.severity === ComplaintSeverity.LOW).length}`);
      
    } catch (error) {
      console.error('❌ Error seeding complaints:', error);
      throw error;
    }
  }

  async clear() {
    console.log('🧹 Clearing complaints collection...');
    await this.complaintModel.deleteMany({});
    console.log('✅ Complaints collection cleared');
  }
}