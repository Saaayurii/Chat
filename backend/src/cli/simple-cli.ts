import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SeedersModule } from '../database/seeders/seeders.module';
import { MainSeeder } from '../database/seeders/main.seeder';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    SeedersModule,
  ],
})
class CliModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: ['error'], // Минимальные логи
  });

  const mainSeeder = app.get(MainSeeder);
  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        console.log('🌱 Starting database seeding...');
        await mainSeeder.seedAll();
        break;

      case 'clear':
        console.log('🧹 Clearing database...');
        await mainSeeder.clearAll();
        break;

      case 'refresh':
        console.log('🔄 Refreshing database...');
        await mainSeeder.reseedAll();
        break;

      default:
        console.log('📖 Usage:');
        console.log('  npm run seed        - Seed database with test data');
        console.log('  npm run seed:clear  - Clear all seeded data');
        console.log('  npm run seed:refresh - Clear and reseed database');
        break;
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Command failed:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();