import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Используем Pino для логирования
  app.useLogger(app.get(Logger));

  // Настройка безопасности
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Компрессия
  app.use(compression());

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
  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? [
          process.env.CLIENT_URL,
          process.env.WIDGET_URL,
          process.env.ADMIN_PANEL_URL,
          'https://chat-admin-panel.vercel.app', // Админ панель
          'https://chat-nine-snowy.vercel.app', // Виджет
        ]
          .filter(Boolean)
          .map((url) => url?.replace(/\/$/, '')) // Убираем слеш в конце
      : [
          process.env.CLIENT_URL,
          process.env.WIDGET_URL,
          process.env.ADMIN_PANEL_URL,
          'http://localhost:5500',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3005',
        ]
          .filter(Boolean)
          .map((url) => url?.replace(/\/$/, '')); // Убираем слеш в конце

  app.enableCors({
    origin: (origin, callback) => {
      console.log(
        `🌐 CORS check: origin = ${origin}, NODE_ENV = ${process.env.NODE_ENV}`,
      );
      console.log(`🌐 CORS origins:`, corsOrigins);

      // Разрешить запросы без origin (например, мобильные приложения)
      if (!origin) {
        console.log(`🌐 CORS: Allowing request without origin`);
        return callback(null, true);
      }

      // Разрешить запросы с разрешенных доменов
      if (corsOrigins.includes(origin)) {
        console.log(`🌐 CORS: Origin ${origin} found in corsOrigins - ALLOWED`);
        return callback(null, true);
      }

      // Разрешить все vercel.app домены в production
      if (
        process.env.NODE_ENV === 'production' &&
        origin.endsWith('.vercel.app')
      ) {
        console.log(`🌐 CORS: Vercel domain ${origin} - ALLOWED`);
        return callback(null, true);
      }

      // Разрешить localhost в development
      if (
        process.env.NODE_ENV !== 'production' &&
        origin.includes('localhost')
      ) {
        console.log(`🌐 CORS: Localhost domain ${origin} - ALLOWED`);
        return callback(null, true);
      }

      console.log(`🌐 CORS: Origin ${origin} - BLOCKED`);
      callback(new Error('Not allowed by CORS'));
    },
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

  // 🚀 Запуск приложения - КРИТИЧНО для Render
  const port = process.env.PORT || 3000;
  
  // Bind to 0.0.0.0 for cloud deployment
  await app.listen(port, '0.0.0.0');

  // 📊 Логирование информации о запуске
  console.log(`🚀 Приложение запущено на порту: ${port}`);
  console.log(`🌍 Listening on: http://0.0.0.0:${port}`);
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log(`📚 API Documentation: http://0.0.0.0:${port}/api-docs`);
  console.log('🔗 Client URL:', process.env.CLIENT_URL);
  console.log('🔗 Admin Panel URL:', process.env.ADMIN_PANEL_URL);
  console.log('🔗 Widget URL:', process.env.WIDGET_URL);
  console.log('🌐 CORS Origins:', corsOrigins);
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
  console.log(
    '📦 Redis:',
    process.env.REDIS_URL ? '✅ Подключено' : '❌ Не настроено',
  );
}

bootstrap();