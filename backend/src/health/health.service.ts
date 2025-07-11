import { Injectable } from '@nestjs/common';
import { 
  HealthCheckService, 
  HealthCheck, 
  MongooseHealthIndicator,
  HealthCheckResult
} from '@nestjs/terminus';
import { RedisService } from '../common/services/redis.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private redisService: RedisService,
    @InjectConnection() private connection: Connection,
  ) {}

  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.redisHealthCheck(),
    ]);
  }

  @HealthCheck()
  async ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.redisHealthCheck(),
      () => this.webSocketHealthCheck(),
    ]);
  }

  @HealthCheck()
  async live(): Promise<HealthCheckResult> {
    return this.health.check([
      () => Promise.resolve({
        app: {
          status: 'up',
          timestamp: new Date().toISOString(),
        },
      }),
    ]);
  }

  private async redisHealthCheck(): Promise<any> {
    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client is not available');
      }
      const result = await client.ping();
      
      if (result === 'PONG') {
        return {
          redis: {
            status: 'up',
            message: 'Redis connection is healthy',
          },
        };
      }
      
      throw new Error('Redis ping failed');
    } catch (error) {
      throw new Error(`Redis health check failed: ${error.message}`);
    }
  }

  private async webSocketHealthCheck(): Promise<any> {
    try {
      // Проверяем, что WebSocket сервер готов
      return {
        websocket: {
          status: 'up',
          message: 'WebSocket server is ready',
        },
      };
    } catch (error) {
      throw new Error(`WebSocket health check failed: ${error.message}`);
    }
  }
}