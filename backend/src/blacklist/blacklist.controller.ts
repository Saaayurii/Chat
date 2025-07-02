import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BlacklistService } from './blacklist.service';
import { CreateBlacklistEntryDto } from './dto/create-blacklist-entry.dto';
import { UpdateBlacklistEntryDto, ApproveBlacklistEntryDto, RevokeBlacklistEntryDto } from './dto/update-blacklist-entry.dto';
import { QueryBlacklistDto } from './dto/query-blacklist.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthenticatedRequest } from '../common/interfaces/auth-request.interface';
import { UserRole } from '../database/schemas/user.schema';

@ApiTags('Blacklist')
@Controller('blacklist')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Добавить пользователя в черный список',
    description: 'Позволяет администратору заблокировать пользователя с указанием причины, типа блокировки и доказательств. Автоматически уведомляет пользователя по email'
  })
  @ApiBody({ type: CreateBlacklistEntryDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Пользователь успешно добавлен в черный список',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'object' },
        reason: { type: 'string', example: 'SPAM' },
        description: { type: 'string' },
        type: { type: 'string', example: 'temporary' },
        status: { type: 'string', example: 'active' },
        expiresAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        blockedBy: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные или пользователь уже заблокирован' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async createBlacklistEntry(
    @Body() createDto: CreateBlacklistEntryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.blacklistService.createBlacklistEntry(createDto, req.user._id.toString());
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Получить список записей черного списка',
    description: 'Возвращает отфильтрованный список всех записей черного списка с пагинацией и сортировкой'
  })
  @ApiQuery({ type: QueryBlacklistDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Список записей черного списка получен',
    schema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              userId: { type: 'object' },
              reason: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              blockedBy: { type: 'object' },
              approvedBy: { type: 'object' }
            }
          }
        },
        total: { type: 'number', example: 42 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findAll(@Query() queryDto: QueryBlacklistDto) {
    return this.blacklistService.findAll(queryDto);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Получить статистику черного списка',
    description: 'Возвращает статистику по записям черного списка: распределение по статусам и причинам блокировки'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика черного списка',
    schema: {
      type: 'object',
      properties: {
        statusStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'active' },
              count: { type: 'number', example: 15 }
            }
          }
        },
        reasonStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'SPAM' },
              count: { type: 'number', example: 8 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async getStats() {
    return this.blacklistService.getBlacklistStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Получить запись черного списка по ID',
    description: 'Возвращает детальную информацию о конкретной записи черного списка'
  })
  @ApiParam({ name: 'id', description: 'ID записи черного списка', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Детали записи черного списка',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'object' },
        reason: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' },
        status: { type: 'string' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        createdAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
        blockedBy: { type: 'object' },
        approvedBy: { type: 'object' },
        revokedBy: { type: 'object' },
        userNotified: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.blacklistService.findById(id);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Получить записи черного списка пользователя',
    description: 'Возвращает все записи черного списка для конкретного пользователя'
  })
  @ApiParam({ name: 'userId', description: 'ID пользователя', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список записей черного списка пользователя',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          reason: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          blockedBy: { type: 'object' },
          approvedBy: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findByUserId(@Param('userId', ParseObjectIdPipe) userId: string) {
    return this.blacklistService.findByUserId(userId);
  }

  @Get('check/:userId')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ 
    summary: 'Проверить статус блокировки пользователя',
    description: 'Проверяет, находится ли пользователь в активной блокировке'
  })
  @ApiParam({ name: 'userId', description: 'ID пользователя для проверки', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Статус блокировки пользователя',
    schema: {
      type: 'object',
      properties: {
        isBlacklisted: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async checkUserBlacklist(@Param('userId', ParseObjectIdPipe) userId: string) {
    const isBlacklisted = await this.blacklistService.isUserBlacklisted(userId);
    return { isBlacklisted };
  }

  @Put(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Одобрить или отклонить блокировку',
    description: 'Позволяет администратору одобрить или отклонить блокировку пользователя с комментарием'
  })
  @ApiParam({ name: 'id', description: 'ID записи черного списка', type: 'string' })
  @ApiBody({ type: ApproveBlacklistEntryDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Решение по блокировке принято',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        approvedByAdmin: { type: 'boolean' },
        approvedBy: { type: 'object' },
        approvedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async approveEntry(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() approveDto: ApproveBlacklistEntryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.blacklistService.approveEntry(id, approveDto, req.user._id.toString());
  }

  @Put(':id/revoke')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Отменить блокировку',
    description: 'Позволяет администратору отменить активную блокировку пользователя с указанием причины отмены'
  })
  @ApiParam({ name: 'id', description: 'ID записи черного списка', type: 'string' })
  @ApiBody({ type: RevokeBlacklistEntryDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Блокировка успешно отменена',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string', example: 'revoked' },
        revokedBy: { type: 'object' },
        revokedAt: { type: 'string', format: 'date-time' },
        revocationReason: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Можно отменить только активную блокировку' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async revokeEntry(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() revokeDto: RevokeBlacklistEntryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.blacklistService.revokeEntry(id, revokeDto, req.user._id.toString());
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Обновить запись черного списка',
    description: 'Позволяет администратору обновить данные записи черного списка: статус, причину отмены и другие параметры'
  })
  @ApiParam({ name: 'id', description: 'ID записи черного списка', type: 'string' })
  @ApiBody({ type: UpdateBlacklistEntryDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Запись успешно обновлена',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string' },
        approvedByAdmin: { type: 'boolean' },
        revocationReason: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async updateEntry(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateBlacklistEntryDto,
  ) {
    return this.blacklistService.updateEntry(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Удалить запись из черного списка',
    description: 'Удаляет запись из черного списка и разблокирует пользователя, если блокировка была активной. Операция необратима'
  })
  @ApiParam({ name: 'id', description: 'ID записи черного списка', type: 'string' })
  @ApiResponse({ status: 204, description: 'Запись успешно удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async deleteEntry(@Param('id', ParseObjectIdPipe) id: string) {
    await this.blacklistService.deleteEntry(id);
  }

  @Post('process-expired')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Обработать просроченные блокировки',
    description: 'Автоматически обрабатывает все просроченные временные блокировки: переводит их в статус "истекшие" и разблокирует пользователей'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Просроченные записи обработаны',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Просроченные записи обработаны' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async processExpiredEntries() {
    await this.blacklistService.processExpiredEntries();
    return { message: 'Просроченные записи обработаны' };
  }
}
