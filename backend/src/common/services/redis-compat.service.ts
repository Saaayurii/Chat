import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Совместимый сервис для работы с разными версиями Redis клиента
 */
@Injectable()
export class RedisCompatService {
  private readonly logger = new Logger(RedisCompatService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Безопасная подписка на Redis канал с обработкой разных API
   */
  async safeSubscribe(channel: string, callback: (message: any) => void): Promise<any> {
    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      // Создаем отдельный клиент для подписки
      const subscriber = client.duplicate();
      
      if (!subscriber.isOpen && !subscriber.isReady) {
        await subscriber.connect();
      }

      // Пробуем разные способы подписки в зависимости от версии API
      try {
        // Современный API (redis v4+)
        await subscriber.subscribe(channel, (message: string, channelName?: string) => {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            this.logger.error('Error parsing subscription message:', error.message);
          }
        });
      } catch (error) {
        // Fallback на старый API
        subscriber.on('message', (receivedChannel: string, message: string) => {
          if (receivedChannel === channel) {
            try {
              const parsedMessage = JSON.parse(message);
              callback(parsedMessage);
            } catch (parseError) {
              this.logger.error('Error parsing subscription message:', parseError.message);
            }
          }
        });

        await subscriber.subscribe(channel, callback);
      }

      return subscriber;
    } catch (error) {
      this.logger.error('Error in safe subscribe:', error.message);
      return null;
    }
  }

  /**
   * Безопасное получение задачи из очереди
   */
  async safeDequeueTask(queueName: string): Promise<any | null> {
    try {
      const client = await this.redisService.getClient();
      if (!client) return null;

      // Пробуем zPopMax
      try {
        const result = await client.zPopMax(`queue:${queueName}`);
        
        if (!result) return null;

        // Обрабатываем разные форматы ответа
        if (Array.isArray(result)) {
          if (result.length > 0 && result[0] && typeof result[0] === 'object' && 'value' in result[0]) {
            return JSON.parse(result[0].value);
          }
        } else if (typeof result === 'object' && 'value' in result) {
          return JSON.parse(result.value);
        }

        return null;
      } catch (error) {
        this.logger.warn('zPopMax not available, using alternative method');
        
        // Fallback на zRange + zRem
        const results = await client.zRange(`queue:${queueName}`, -1, -1);
        
        if (results && results.length > 0) {
          const taskData = results[0];
          await client.zRem(`queue:${queueName}`, taskData);
          return JSON.parse(taskData);
        }

        return null;
      }
    } catch (error) {
      this.logger.error('Error in safe dequeue task:', error.message);
      return null;
    }
  }

  /**
   * Безопасное выполнение pipeline операций
   */
  async safePipelineExec(operations: Array<{ command: string; args: any[] }>): Promise<any[]> {
    try {
      const client = this.redisService.getClient();
      if (!client) return [];

      const pipeline = client.multi();

      for (const op of operations) {
        // Динамически вызываем команды
        if (typeof pipeline[op.command] === 'function') {
          pipeline[op.command](...op.args);
        }
      }

      const results = await pipeline.exec();
      
      // Обрабатываем результаты с учетом разных форматов
      if (Array.isArray(results)) {
        return results.map(result => {
          if (Array.isArray(result) && result.length === 2) {
            // Формат [error, value]
            return result[1];
          }
          return result;
        });
      }

      return results || [];
    } catch (error) {
      this.logger.error('Error in safe pipeline exec:', error.message);
      return [];
    }
  }

  /**
   * Безопасное получение значения с правильным типизированием
   */
  async safeGet(key: string): Promise<string | null> {
    try {
      const client = this.redisService.getClient();
      if (!client) return null;

      const value = await client.get(key);
      return typeof value === 'string' ? value : null;
    } catch (error) {
      this.logger.error('Error in safe get:', error.message);
      return null;
    }
  }

  /**
   * Безопасное получение метрик с правильной обработкой типов
   */
  async safeGetMetricsRange(metricName: string, startDate: string, endDate: string): Promise<{[date: string]: number}> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: string[] = [];
      const operations: Array<{ command: string; args: any[] }> = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        operations.push({
          command: 'get',
          args: [`metrics:${metricName}:${dateStr}`]
        });
      }
      
      const results = await this.safePipelineExec(operations);
      const metrics: {[date: string]: number} = {};
      
      dates.forEach((date, index) => {
        const value = results[index];
        const numValue = value ? parseInt(String(value), 10) : 0;
        metrics[date] = isNaN(numValue) ? 0 : numValue;
      });
      
      return metrics;
    } catch (error) {
      this.logger.error('Error getting safe metrics range:', error.message);
      return {};
    }
  }

  /**
   * Проверка доступности Redis и его возможностей
   */
  async checkRedisCapabilities(): Promise<{
    connected: boolean;
    pubSubSupported: boolean;
    zPopMaxSupported: boolean;
    pipelineSupported: boolean;
  }> {
    try {
      const client = this.redisService.getClient();
      if (!client || !client.isReady) {
        return {
          connected: false,
          pubSubSupported: false,
          zPopMaxSupported: false,
          pipelineSupported: false
        };
      }

      // Проверяем ping
      await client.ping();

      // Проверяем поддержку zPopMax
      let zPopMaxSupported = false;
      try {
        await client.zPopMax('test_capability_check');
        zPopMaxSupported = true;
      } catch (error) {
        this.logger.debug('zPopMax not supported');
      }

      // Проверяем поддержку pub/sub
      let pubSubSupported = false;
      try {
        const testSub = client.duplicate();
        await testSub.connect();
        await testSub.subscribe('test_capability_check', () => {});
        await testSub.unsubscribe('test_capability_check');
        await testSub.quit();
        pubSubSupported = true;
      } catch (error) {
        this.logger.debug('PubSub not fully supported');
      }

      // Проверяем поддержку pipeline
      let pipelineSupported = false;
      try {
        const pipeline = client.multi();
        pipeline.ping();
        await pipeline.exec();
        pipelineSupported = true;
      } catch (error) {
        this.logger.debug('Pipeline not supported');
      }

      return {
        connected: true,
        pubSubSupported,
        zPopMaxSupported,
        pipelineSupported
      };
    } catch (error) {
      this.logger.error('Error checking Redis capabilities:', error.message);
      return {
        connected: false,
        pubSubSupported: false,
        zPopMaxSupported: false,
        pipelineSupported: false
      };
    }
  }
}