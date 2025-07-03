import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { MainSeeder } from '../database/seeders/main.seeder';

@Injectable()
export class SeedCommand {
  constructor(private readonly mainSeeder: MainSeeder) {}

  @Command({
    command: 'seed',
    describe: 'Seed database with test data',
    autoExit: true,
  })
  async create() {
    try {
      await this.mainSeeder.seedAll();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }

  @Command({
    command: 'seed:clear',
    describe: 'Clear all seeded data from database',
    autoExit: true,
  })
  async clear() {
    try {
      await this.mainSeeder.clearAll();
      process.exit(0);
    } catch (error) {
      console.error('❌ Clearing failed:', error);
      process.exit(1);
    }
  }

  @Command({
    command: 'seed:refresh',
    describe: 'Clear and reseed database with fresh test data',
    autoExit: true,
  })
  async refresh() {
    try {
      await this.mainSeeder.reseedAll();
      process.exit(0);
    } catch (error) {
      console.error('❌ Reseeding failed:', error);
      process.exit(1);
    }
  }
}