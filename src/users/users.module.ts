import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { ProfileController } from './profile.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService], // Экспортируем для использования в других модулях
})
export class UsersModule {}