import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { UsersService } from '../../users/users.service';
import { Types } from 'mongoose';

@Injectable()
export class WsOptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] WsOptionalAuthGuard: Processing client ${client.id}`);
      
      // Сначала пытаемся аутентифицировать как обычного пользователя
      const token = this.extractTokenFromClient(client);
      
      if (token) {
        console.log(`[${timestamp}] WsOptionalAuthGuard: Token found, attempting JWT verification`);
        
        try {
          // Верифицируем JWT токен
          const jwtSecret = this.configService.get<string>('JWT_SECRET');
          const payload = this.jwtService.verify(token, { secret: jwtSecret });

          // Проверяем существование и статус пользователя
          const user = await this.usersService.findByEmail(payload.email);
          if (user && !user.isBlocked && (user.isActivated || user.role === 'operator' || user.role === 'admin')) {
            // Авторизованный пользователь
            client.data.user = {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
              isAuthenticated: true
            };
            
            console.log(`[${timestamp}] WsOptionalAuthGuard: Authenticated user connected:`, { email: user.email, role: user.role });
            return true;
          }
        } catch (jwtError) {
          console.log(`[${timestamp}] WsOptionalAuthGuard: JWT verification failed, checking for anonymous:`, jwtError.message);
        }
      }
      
      // Если нет валидного токена, проверяем анонимного пользователя
      const sessionId = this.extractSessionIdFromClient(client);
      
      if (sessionId) {
        console.log(`[${timestamp}] WsOptionalAuthGuard: SessionId found for anonymous user:`, sessionId);
        
        // Создаем анонимного пользователя
        client.data.user = {
          id: new Types.ObjectId().toString(),
          sessionId,
          role: 'VISITOR',
          isAuthenticated: false,
          isAnonymous: true
        };
        
        console.log(`[${timestamp}] WsOptionalAuthGuard: Anonymous user connected with sessionId:`, sessionId);
        return true;
      }
      
      console.log(`[${timestamp}] WsOptionalAuthGuard: No valid authentication method found, denying connection`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return false;
      
    } catch (error) {
      console.error(`WsOptionalAuthGuard: Authentication error:`, error);
      const client: Socket = context.switchToWs().getClient();
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
    
    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader as string;
    }
    
    // Также проверяем query параметры
    const token = client.handshake.query?.token;
    if (token && typeof token === 'string') {
      return token;
    }
    
    return null;
  }

  private extractSessionIdFromClient(client: Socket): string | null {
    const sessionId = client.handshake.auth?.sessionId || client.handshake.query?.sessionId;
    
    if (sessionId && typeof sessionId === 'string') {
      return sessionId;
    }
    
    return null;
  }
}