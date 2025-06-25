import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🍪 Используем cookie-parser
  app.use(cookieParser());

  // ✅ Глобальная валидация DTO (с авто-ошибками и фильтрацией)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // удаляет лишние поля
      forbidNonWhitelisted: true, // выбрасывает ошибку при лишних полях
      transform: true,            // автоматически приводит типы
    }),
  );

  // 📄 Swagger-конфигурация
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Документация API чата')
    .setDescription('REST API + WebSocket чата')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  // Добавление ручного описания WebSocket-энпойнта
  swaggerDocument.paths['/chat'] = {
    get: {
      tags: ['WebSocket'],
      summary: 'Подключиться к WebSocket-чату',
      description: 'Используйте WebSocket-протокол для подключения к чату',
      responses: {
        101: {
          description: 'WebSocket handshake successful',
        },
      },
    },
  };

  // 🌐 Swagger UI на /api-docs
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  // 🟡 Разрешаем CORS (лучше настраивать конкретные домены на проде)
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // 🔌 WebSocket адаптер
  app.useWebSocketAdapter(new IoAdapter(app));

  // 🚀 Запуск приложения
  const port = 3000;
  await app.listen(port);
  console.log(`🚀 Приложение запущено на 3000 порту`);
}

bootstrap();
