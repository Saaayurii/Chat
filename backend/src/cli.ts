import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { CliModule } from './cli/cli.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: false, // Отключаем логи NestJS для CLI
  });

  try {
    await app.select(CommandModule).get(CommandService).exec();
    await app.close();
  } catch (error) {
    console.error('❌ CLI command failed:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();