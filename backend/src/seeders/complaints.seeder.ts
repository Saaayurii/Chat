import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Complaint, ComplaintDocument,
  ComplaintStatus, ComplaintType, ComplaintSeverity,
} from '../database/schemas/complaint.schema';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

@Injectable()
export class ComplaintsSeeder {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<ComplaintDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding complaints...');

    const count = await this.complaintModel.countDocuments();
    if (count > 0) {
      console.log('😤 Complaints already exist, skipping complaints seeding');
      return;
    }

    const visitors = await this.userModel.find({ role: UserRole.VISITOR }).limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR }).limit(10);
    const admins = await this.userModel.find({ role: UserRole.ADMIN }).limit(10);

    if (visitors.length < 5 || operators.length < 4 || admins.length < 2) {
      console.log(`❌ Not enough users to seed complaints`);
      return;
    }

    const complaints = [
      {
        complaintText: 'Оператор Мария была крайне невежлива, повышала голос и не хотела помочь с решением проблемы.',
        type: ComplaintType.RUDE_BEHAVIOR,
        severity: ComplaintSeverity.HIGH,
        status: ComplaintStatus.PENDING,
        visitorId: visitors[0]._id,
        operatorId: operators[0]._id,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        complaintText: 'Ждал ответа от оператора более 2 часов. Это неприемлемо для срочного вопроса.',
        type: ComplaintType.SLOW_RESPONSE,
        severity: ComplaintSeverity.MEDIUM,
        status: ComplaintStatus.PENDING,
        visitorId: visitors[1]._id,
        operatorId: operators[1]._id,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        complaintText: 'Оператор не смог решить проблему и дал неверные советы.',
        type: ComplaintType.POOR_SERVICE,
        severity: ComplaintSeverity.HIGH,
        status: ComplaintStatus.PENDING,
        visitorId: visitors[2]._id,
        operatorId: operators[2]._id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        complaintText: 'Оператор обсуждал мои персональные данные при других сотрудниках.',
        type: ComplaintType.OTHER,
        severity: ComplaintSeverity.CRITICAL,
        status: ComplaintStatus.UNDER_REVIEW,
        visitorId: visitors[3]._id,
        operatorId: operators[3]._id,
        reviewerId: admins[0]._id,
        assignedAt: new Date(Date.now() - 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        complaintText: 'Оператор подчеркнул мой возраст и намекнул на некомпетентность.',
        type: ComplaintType.OTHER,
        severity: ComplaintSeverity.CRITICAL,
        status: ComplaintStatus.UNDER_REVIEW,
        visitorId: visitors[4]._id,
        operatorId: operators[3]._id,
        reviewerId: admins[1]._id,
        assignedAt: new Date(Date.now() - 86400000),
        escalatedAt: new Date(Date.now() - 43200000),
        escalationReason: 'Подозрение на дискриминацию',
        adminNotes: 'Требуется расследование',
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
    ];

    try {
      const inserted = await this.complaintModel.insertMany(complaints);
      console.log(`✅ Successfully inserted ${inserted.length} complaints`);
    } catch (err) {
      console.error('❌ Error seeding complaints:', err);
    }
  }

  async clear() {
    await this.complaintModel.deleteMany({});
    console.log('✅ Complaints cleared');
  }
}
