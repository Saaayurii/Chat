import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { UsersService } from '../../users/users.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // Получаем токен из handshake (при подключении) или из auth заголовка
      const token = this.extractTokenFromClient(client);
      
      if (!token) {
        client.disconnect();
        return false;
      }

      // Верифицируем JWT токен
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret: jwtSecret });

      // Проверяем существование и статус пользователя
      const user = await this.usersService.findByEmail(payload.email);
      if (!user || user.isBlocked || !user.isActivated) {
        client.disconnect();
        return false;
      }

      // Сохраняем данные пользователя в клиенте для дальнейшего использования
      client.data.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        username: user.profile?.username,
      };

      return true;
    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    // Попытка получить токен из разных источников
    const authHeader = client.handshake.headers.authorization;
    const tokenFromAuth = client.handshake.auth?.token;
    const tokenFromQuery = client.handshake.query?.token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    if (tokenFromAuth) {
      return tokenFromAuth;
    }
    
    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    return null;
  }
}
