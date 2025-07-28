import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig = (configService: ConfigService): MongooseModuleOptions => {
  const mongoUri = configService.get<string>('MONGO_URI');
  
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  return {
    uri: mongoUri,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
};