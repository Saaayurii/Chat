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
      console.log(`[${timestamp}] WsOptionalAuthGuard: No valid JWT token, attempting anonymous authentication`);
      
      const sessionId = this.extractSessionIdFromClient(client);
      
      if (sessionId) {
        console.log(`[${timestamp}] WsOptionalAuthGuard: SessionId found for anonymous user:`, sessionId);
        
        // Создаем уникальный ID для анонимного пользователя
        const anonymousUserId = new Types.ObjectId().toString();
        
        // Создаем анонимного пользователя
        client.data.user = {
          id: anonymousUserId,
          sessionId,
          role: 'VISITOR',
          isAuthenticated: false,
          isAnonymous: true
        };
        
        console.log(`[${timestamp}] WsOptionalAuthGuard: Anonymous user created:`, {
          id: anonymousUserId,
          sessionId,
          role: 'VISITOR',
          isAuthenticated: false,
          isAnonymous: true
        });
        
        return true;
      } else {
        console.log(`[${timestamp}] WsOptionalAuthGuard: No sessionId found for anonymous authentication`);
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
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] WsOptionalAuthGuard: Extracting token from client ${client.id}`);
    
    const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
    console.log(`[${timestamp}] WsOptionalAuthGuard: Auth header:`, authHeader);
    
    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log(`[${timestamp}] WsOptionalAuthGuard: Bearer token found`);
        return token;
      }
      console.log(`[${timestamp}] WsOptionalAuthGuard: Direct token found`);
      return authHeader as string;
    }
    
    // Также проверяем query параметры
    const token = client.handshake.query?.token;
    console.log(`[${timestamp}] WsOptionalAuthGuard: Query token:`, token);
    
    if (token && typeof token === 'string') {
      console.log(`[${timestamp}] WsOptionalAuthGuard: Token found in query parameters`);
      return token;
    }
    
    console.log(`[${timestamp}] WsOptionalAuthGuard: No token found`);
    return null;
  }

  private extractSessionIdFromClient(client: Socket): string | null {
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] WsOptionalAuthGuard: Extracting sessionId from client ${client.id}`);
    console.log(`[${timestamp}] WsOptionalAuthGuard: handshake.auth:`, client.handshake.auth);
    console.log(`[${timestamp}] WsOptionalAuthGuard: handshake.query:`, client.handshake.query);
    
    const sessionId = client.handshake.auth?.sessionId || client.handshake.query?.sessionId;
    
    console.log(`[${timestamp}] WsOptionalAuthGuard: Extracted sessionId:`, sessionId);
    
    if (sessionId && typeof sessionId === 'string') {
      console.log(`[${timestamp}] WsOptionalAuthGuard: Valid sessionId found:`, sessionId);
      return sessionId;
    }
    
    console.log(`[${timestamp}] WsOptionalAuthGuard: No valid sessionId found`);
    return null;
  }
}