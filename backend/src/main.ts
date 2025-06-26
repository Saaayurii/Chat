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

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Документация API чата')
    .setDescription('REST API + WebSocket чата')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
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

  SwaggerModule.setup('api-docs', app, swaggerDocument);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = 3000;
  await app.listen(port);
  console.log(`🚀 Приложение запущено на 3000 порту`);
}

bootstrap();
