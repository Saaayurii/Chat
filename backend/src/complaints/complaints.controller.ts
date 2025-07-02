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
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto, ReviewComplaintDto } from './dto/update-complaint.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthenticatedRequest } from '../common/interfaces/auth-request.interface';
import { UserRole } from '../database/schemas/user.schema';

@ApiTags('Complaints')
@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Roles(UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Подать жалобу',
    description: 'Позволяет посетителю подать жалобу на оператора с указанием типа, описания и доказательств'
  })
  @ApiBody({ type: CreateComplaintDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Жалоба успешно подана и принята к рассмотрению',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        type: { type: 'string', example: 'INAPPROPRIATE_BEHAVIOR' },
        complaintText: { type: 'string', example: 'Оператор грубо отвечал...' },
        status: { type: 'string', example: 'pending' },
        severity: { type: 'string', example: 'medium' },
        createdAt: { type: 'string', format: 'date-time' },
        visitorId: { type: 'object' },
        operatorId: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные жалобы' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async createComplaint(
    @Body() createDto: CreateComplaintDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.complaintsService.createComplaint(createDto, req.user._id.toString());
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить список жалоб',
    description: 'Возвращает отфильтрованный список всех жалоб с пагинацией и сортировкой'
  })
  @ApiQuery({ type: QueryComplaintsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Список жалоб получен',
    schema: {
      type: 'object',
      properties: {
        complaints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              type: { type: 'string' },
              complaintText: { type: 'string' },
              status: { type: 'string' },
              severity: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              visitorId: { type: 'object' },
              operatorId: { type: 'object' },
              reviewedBy: { type: 'object' }
            }
          }
        },
        total: { type: 'number', example: 85 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findAll(@Query() queryDto: QueryComplaintsDto) {
    return this.complaintsService.findAll(queryDto);
  }

  @Get('my')
  @Roles(UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить мои жалобы',
    description: 'Возвращает все жалобы текущего посетителя'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список жалоб пользователя',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          type: { type: 'string' },
          complaintText: { type: 'string' },
          status: { type: 'string' },
          severity: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          operatorId: { type: 'object' },
          reviewedBy: { type: 'object' },
          adminResponse: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findMyComplaints(@Request() req: AuthenticatedRequest) {
    return this.complaintsService.findByUserId(req.user._id.toString());
  }

  @Get('operator/:operatorId')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить жалобы на оператора',
    description: 'Возвращает все жалобы на конкретного оператора'
  })
  @ApiParam({ name: 'operatorId', description: 'ID оператора', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список жалоб на оператора',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          type: { type: 'string' },
          complaintText: { type: 'string' },
          status: { type: 'string' },
          severity: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          visitorId: { type: 'object' },
          reviewedBy: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оператор не найден' })
  async findByOperator(@Param('operatorId', ParseObjectIdPipe) operatorId: string) {
    return this.complaintsService.findByOperatorId(operatorId);
  }

  @Get('operator/:operatorId/history')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить историю жалоб оператора',
    description: 'Возвращает полную статистику жалоб на оператора: общее количество, решенные, предупреждения, блокировки'
  })
  @ApiParam({ name: 'operatorId', description: 'ID оператора', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика жалоб оператора',
    schema: {
      type: 'object',
      properties: {
        complaints: { type: 'array' },
        totalComplaints: { type: 'number', example: 12 },
        resolvedComplaints: { type: 'number', example: 8 },
        warningsCount: { type: 'number', example: 3 },
        suspensionsCount: { type: 'number', example: 1 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оператор не найден' })
  async getOperatorComplaintHistory(@Param('operatorId', ParseObjectIdPipe) operatorId: string) {
    return this.complaintsService.getOperatorComplaintHistory(operatorId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить общую статистику жалоб',
    description: 'Возвращает статистику по всем жалобам: распределение по статусам, типам, серьёзности, топ операторов с жалобами'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Общая статистика жалоб',
    schema: {
      type: 'object',
      properties: {
        statusStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'pending' },
              count: { type: 'number', example: 15 }
            }
          }
        },
        typeStats: { type: 'array' },
        severityStats: { type: 'array' },
        operatorStats: { type: 'array' },
        avgResolutionTimeHours: { type: 'number', example: 24.5 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async getStats() {
    return this.complaintsService.getComplaintStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить жалобу по ID',
    description: 'Возвращает детальную информацию о жалобе. Посетители могут видеть только свои жалобы'
  })
  @ApiParam({ name: 'id', description: 'ID жалобы', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Детали жалобы',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        type: { type: 'string' },
        complaintText: { type: 'string' },
        severity: { type: 'string' },
        status: { type: 'string' },
        evidence: { type: 'array' },
        createdAt: { type: 'string', format: 'date-time' },
        reviewedAt: { type: 'string', format: 'date-time' },
        resolvedAt: { type: 'string', format: 'date-time' },
        visitorId: { type: 'object' },
        operatorId: { type: 'object' },
        reviewedBy: { type: 'object' },
        adminResponse: { type: 'string' },
        resolutionNotes: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет доступа к этой жалобе' })
  @ApiResponse({ status: 404, description: 'Жалоба не найдена' })
  async findById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const complaint = await this.complaintsService.findById(id);
    
    // Посетитель может видеть только свои жалобы
    if (req.user.role === UserRole.VISITOR && complaint.visitorId.toString() !== req.user._id.toString()) {
      throw new Error('Нет доступа');
    }
    
    return complaint;
  }

  @Put(':id/review')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Рассмотреть жалобу',
    description: 'Позволяет администратору рассмотреть жалобу, принять решение и применить меры к оператору (предупреждение, блокировка)'
  })
  @ApiParam({ name: 'id', description: 'ID жалобы', type: 'string' })
  @ApiBody({ type: ReviewComplaintDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Жалоба успешно рассмотрена',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string', example: 'resolved' },
        adminResponse: { type: 'string' },
        resolutionNotes: { type: 'string' },
        reviewedBy: { type: 'object' },
        reviewedAt: { type: 'string', format: 'date-time' },
        operatorWarned: { type: 'boolean' },
        operatorSuspended: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Можно рассмотреть только ожидающие жалобы' })
  @ApiResponse({ status: 404, description: 'Жалоба не найдена' })
  async reviewComplaint(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() reviewDto: ReviewComplaintDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.complaintsService.reviewComplaint(id, reviewDto, req.user._id.toString());
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Обновить жалобу',
    description: 'Позволяет администратору обновить данные жалобы: статус, серьёзность, дату последующего контроля'
  })
  @ApiParam({ name: 'id', description: 'ID жалобы', type: 'string' })
  @ApiBody({ type: UpdateComplaintDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Жалоба успешно обновлена',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string' },
        severity: { type: 'string' },
        followUpRequired: { type: 'boolean' },
        followUpDate: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Жалоба не найдена' })
  async updateComplaint(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateComplaintDto,
  ) {
    return this.complaintsService.updateComplaint(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Удалить жалобу',
    description: 'Удаляет жалобу из системы. Операция необратима'
  })
  @ApiParam({ name: 'id', description: 'ID жалобы', type: 'string' })
  @ApiResponse({ status: 204, description: 'Жалоба успешно удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Жалоба не найдена' })
  async deleteComplaint(@Param('id', ParseObjectIdPipe) id: string) {
    await this.complaintsService.deleteComplaint(id);
  }
}