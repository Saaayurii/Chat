import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET не найден в переменных окружения');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT validate called with payload:', { sub: payload.sub, email: payload.email, role: payload.role });
    
    if (!payload || !payload.email) {
      console.error('Invalid JWT payload - missing email');
      throw new UnauthorizedException('Неверный токен доступа');
    }

    try {
      const user = await this.usersService.findByEmail(payload.email);
      
      if (!user) {
        console.error('User not found for email:', payload.email);
        throw new UnauthorizedException('Пользователь не найден');
      }

      if (user.isBlocked) {
        console.error('User is blocked:', payload.email);
        throw new UnauthorizedException('Аккаунт заблокирован');
      }

      // Убеждаемся что _id существует
      if (!user._id) {
        console.error('User found but missing _id:', payload.email);
        throw new UnauthorizedException('Ошибка идентификации пользователя');
      }

      console.log('JWT validation successful for user:', { 
        id: user._id.toString(), 
        email: user.email, 
        role: user.role 
      });

      return user;
    } catch (error) {
      console.error('Error in JWT validation:', error);
      throw new UnauthorizedException('Ошибка аутентификации');
    }
  }
}