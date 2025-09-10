import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig = (configService: ConfigService): MongooseModuleOptions => {
  const mongoUri = configService.get<string>('MONGO_URI');
  
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  console.log('🔍 Настраиваем подключение к MongoDB...');

  return {
    uri: mongoUri,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000, // Увеличиваем таймаут
    socketTimeoutMS: 45000,
    // Обработчики событий подключения
    connectionFactory: (connection) => {
      connection.on('connected', () => {
        console.log('✅ MongoDB подключена');
      });
      connection.on('error', (err: Error) => {
        console.error('❌ MongoDB ошибка:', err.message);
      });
      connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB отключена');
      });
      connection.on('reconnected', () => {
        console.log('🔄 MongoDB переподключена');
      });
      return connection;
    },
  };
};