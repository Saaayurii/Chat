import * as dotenv from 'dotenv';
dotenv.config(); // ✅ ПЕРЕД созданием AppModule

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🍪 Cookie parser с секретом для подписанных cookies
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // ✅ Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля
      forbidNonWhitelisted: true, // выбрасывает ошибку при лишних полях
      transform: true, // автоматически приводит типы
    }),
  );

  // 📄 Swagger конфигурация с Bearer Auth
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Документация API чата')
    .setDescription('REST API + WebSocket консультационной системы')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth', // Имя схемы безопасности
    )
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'Refresh token в cookie',
    })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);


  // 🌐 Swagger UI на /api-docs
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  // 🔐 CORS настройки для безопасности
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001', // Конкретный домен
    credentials: true, // Разрешить cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
  });

  // 🔌 WebSocket адаптер
  app.useWebSocketAdapter(new IoAdapter(app));

  // 🚀 Запуск приложения
  const port = process.env.SERVER_PORT || 3000;
  await app.listen(port);

  // 📊 Логирование информации о запуске
  console.log('🚀 Приложение запущено на порту:', port);
  console.log('📚 API Documentation: http://localhost:' + port + '/api-docs');
  console.log('🔗 Client URL:', process.env.CLIENT_URL);
  console.log(
    '🍪 Cookie Secret:',
    process.env.COOKIE_SECRET ? '✅ Настроен' : '❌ Не настроен',
  );
  console.log(
    '🔐 JWT Secret:',
    process.env.JWT_SECRET ? '✅ Настроен' : '❌ Не настроен',
  );
  console.log(
    '📧 Resend API:',
    process.env.RESEND_API_KEY ? '✅ Настроен' : '❌ Не настроен',
  );
  console.log(
    '🗄️ MongoDB:',
    process.env.MONGO_URI ? '✅ Подключено' : '❌ Не настроено',
  );
}

bootstrap();
