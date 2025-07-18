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
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] WsAuthGuard: Starting authentication for client ${client.id}`);
      
      // Получаем токен из handshake (при подключении) или из auth заголовка
      const token = this.extractTokenFromClient(client);
      
      if (!token) {
        console.log(`[${timestamp}] WsAuthGuard: No token found for client ${client.id}, disconnecting`);
        client.disconnect();
        return false;
      }

      console.log(`[${timestamp}] WsAuthGuard: Token found for client ${client.id}, verifying JWT`);

      // Верифицируем JWT токен
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret: jwtSecret });

      console.log(`[${timestamp}] WsAuthGuard: JWT verified for client ${client.id}, payload:`, { email: payload.email, role: payload.role });

      // Проверяем существование и статус пользователя
      const user = await this.usersService.findByEmail(payload.email);
      if (!user || user.isBlocked) {
        console.log(`[${timestamp}] WsAuthGuard: User not found or blocked for client ${client.id}, user:`, { found: !!user, blocked: user?.isBlocked });
        client.disconnect();
        return false;
      }
      
      console.log(`[${timestamp}] WsAuthGuard: User found for client ${client.id}, checking activation status`, { email: user.email, role: user.role, isActivated: user.isActivated });
      
      // Операторы и администраторы могут подключаться даже если не активированы
      if (!user.isActivated && user.role !== 'operator' && user.role !== 'admin') {
        console.log(`[${timestamp}] WsAuthGuard: User not activated and not operator/admin for client ${client.id}, disconnecting`);
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

      console.log(`[${timestamp}] WsAuthGuard: Authentication successful for client ${client.id}, user:`, { id: user._id.toString(), email: user.email, role: user.role });
      return true;
    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] WsAuthGuard: Authentication error for client ${client.id}:`, error.message);
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    const timestamp = new Date().toISOString();
    
    // Попытка получить токен из разных источников
    const authHeader = client.handshake.headers.authorization;
    const tokenFromAuth = client.handshake.auth?.token;
    const tokenFromQuery = client.handshake.query?.token;

    console.log(`[${timestamp}] WsAuthGuard: Extracting token for client ${client.id}`, {
      authHeader: !!authHeader,
      tokenFromAuth: !!tokenFromAuth,
      tokenFromQuery: !!tokenFromQuery
    });

    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log(`[${timestamp}] WsAuthGuard: Found token in Authorization header for client ${client.id}`);
      return authHeader.substring(7);
    }
    
    if (tokenFromAuth) {
      console.log(`[${timestamp}] WsAuthGuard: Found token in auth object for client ${client.id}`);
      return tokenFromAuth;
    }
    
    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      console.log(`[${timestamp}] WsAuthGuard: Found token in query parameters for client ${client.id}`);
      return tokenFromQuery;
    }

    console.log(`[${timestamp}] WsAuthGuard: No token found for client ${client.id}`);
    return null;
  }
}
