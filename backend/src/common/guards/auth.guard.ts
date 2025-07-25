import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../database/schemas/user.schema';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    console.log('AuthGuard handleRequest:', { 
      hasError: !!err, 
      hasUser: !!user, 
      userId: user?._id?.toString(),
      userEmail: user?.email,
      info: info 
    });

    if (err) {
      console.error('Auth error in handleRequest:', err);
      throw err;
    }

    if (!user) {
      console.error('User not found in handleRequest, info:', info);
      throw new UnauthorizedException('Неавторизованный доступ');
    }

    if (!user._id) {
      console.error('User found but missing _id:', user);
      throw new UnauthorizedException('Ошибка идентификации пользователя');
    }

    return user;
  }
}