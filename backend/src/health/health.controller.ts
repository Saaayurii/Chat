import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка состояния приложения' })
  @ApiResponse({ status: 200, description: 'Приложение работает корректно' })
  @ApiResponse({ status: 503, description: 'Одна или несколько служб недоступны' })
  check() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Проверка готовности приложения' })
  @ApiResponse({ status: 200, description: 'Приложение готово к работе' })
  @ApiResponse({ status: 503, description: 'Приложение не готово' })
  ready() {
    return this.healthService.ready();
  }

  @Get('live')
  @ApiOperation({ summary: 'Проверка жизнеспособности приложения' })
  @ApiResponse({ status: 200, description: 'Приложение работает' })
  live() {
    return this.healthService.live();
  }
}