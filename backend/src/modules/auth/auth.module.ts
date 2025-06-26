import { Module } from '@nestjs/common';
import { JwtStrategy, RefreshStrategy } from './strategies/auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UserService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './models/group.model';
import { Message, MessageSchema } from './models/message.model';
import { User, UserSchema } from './models/user.model';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [JwtStrategy, RefreshStrategy, AuthService, UserService],
  controllers: [AuthController],
  exports: [UserService],
})
export class AuthModule {}
