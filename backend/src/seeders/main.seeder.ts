import { Injectable } from '@nestjs/common';
import { UsersSeeder } from './users.seeder';
import { QuestionsSeeder } from './questions.seeder';
import { ComplaintsSeeder } from './complaints.seeder';
import { BlacklistSeeder } from './blacklist.seeder';
import { RatingsSeeder } from './ratings.seeder';
import { ConversationsSeeder } from './conversations.seeder';

@Injectable()
export class MainSeeder {
  constructor(
    private readonly usersSeeder: UsersSeeder,
    private readonly questionsSeeder: QuestionsSeeder,
    private readonly complaintsSeeder: ComplaintsSeeder,
    private readonly blacklistSeeder: BlacklistSeeder,
    private readonly ratingsSeeder: RatingsSeeder,
    private readonly conversationsSeeder: ConversationsSeeder,
  ) {}

  async seedAll() {
    console.log('🚀 Starting database seeding...\n');
    
    try {
      // Порядок важен - сначала создаем пользователей, затем связанные с ними данные
      await this.usersSeeder.seed();
      console.log('');
      
      await this.questionsSeeder.seed();
      console.log('');
      
      await this.complaintsSeeder.seed();
      console.log('');
      
      await this.blacklistSeeder.seed();
      console.log('');
      
      await this.ratingsSeeder.seed();
      console.log('');
      
      await this.conversationsSeeder.seed();
      console.log('');
      
      console.log('🎉 Database seeding completed successfully!');
      console.log('📊 Summary:');
      console.log('  • Users and profiles created');
      console.log('  • Questions with various statuses');
      console.log('  • Complaints and resolutions');
      console.log('  • Blacklist entries with different statuses');
      console.log('  • Operator ratings and feedback');
      console.log('  • Conversations and messages');
      console.log('\n✅ Your database is now populated with realistic test data!');
      
    } catch (error) {
      console.error('❌ Error during database seeding:', error);
      throw error;
    }
  }

  async clearAll() {
    console.log('🧹 Clearing all collections...\n');
    
    try {
      // Очищаем в обратном порядке для соблюдения зависимостей
      await this.conversationsSeeder.clear();
      await this.ratingsSeeder.clear();
      await this.blacklistSeeder.clear();
      await this.complaintsSeeder.clear();
      await this.questionsSeeder.clear();
      await this.usersSeeder.clear();
      
      console.log('\n✅ All collections cleared successfully!');
      
    } catch (error) {
      console.error('❌ Error during database clearing:', error);
      throw error;
    }
  }

  async reseedAll() {
    console.log('🔄 Reseeding database (clear and seed)...\n');
    
    try {
      await this.clearAll();
      console.log('');
      await this.seedAll();
      
    } catch (error) {
      console.error('❌ Error during database reseeding:', error);
      throw error;
    }
  }
}