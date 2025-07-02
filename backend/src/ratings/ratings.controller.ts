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
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryRatingsDto, GetOperatorRatingsDto } from './dto/query-ratings.dto';
import { UpdateRatingVisibilityDto, HideRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthenticatedRequest } from '../common/interfaces/auth-request.interface';
import { UserRole } from '../database/schemas/user.schema';

@ApiTags('Ratings')
@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @Roles(UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Оставить оценку оператору',
    description: 'Позволяет посетителю оставить оценку работе оператора с общей оценкой, комментарием и детализированными оценками'
  })
  @ApiBody({ type: CreateRatingDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Оценка успешно оставлена',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        operatorId: { type: 'object' },
        rating: { type: 'number', example: 5 },
        comment: { type: 'string', example: 'Отличная работа, оператор был вежлив и помог решить проблему' },
        relatedQuestionId: { type: 'object' },
        detailedRating: { type: 'object' },
        isAnonymous: { type: 'boolean', example: false },
        isVisible: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        visitorId: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные оценки или оценка уже оставлена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async createRating(
    @Body() createDto: CreateRatingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ratingsService.createRating(createDto, req.user._id.toString());
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить список всех оценок',
    description: 'Возвращает отфильтрованный список всех оценок операторов с пагинацией и сортировкой'
  })
  @ApiQuery({ type: QueryRatingsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Список оценок получен',
    schema: {
      type: 'object',
      properties: {
        ratings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              operatorId: { type: 'object' },
              visitorId: { type: 'object' },
              rating: { type: 'number' },
              comment: { type: 'string' },
              isVisible: { type: 'boolean' },
              isAnonymous: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              hiddenBy: { type: 'object' },
              hiddenReason: { type: 'string' }
            }
          }
        },
        total: { type: 'number', example: 125 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findAll(@Query() queryDto: QueryRatingsDto) {
    return this.ratingsService.findAll(queryDto);
  }

  @Get('my')
  @Roles(UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить мои оценки',
    description: 'Возвращает все оценки, оставленные текущим посетителем'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список оценок пользователя',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          operatorId: { type: 'object' },
          rating: { type: 'number' },
          comment: { type: 'string' },
          relatedQuestionId: { type: 'object' },
          detailedRating: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findMyRatings(@Request() req: AuthenticatedRequest) {
    return this.ratingsService.getVisitorRatings(req.user._id.toString());
  }

  @Get('operator/:operatorId')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить оценки оператора',
    description: 'Возвращает оценки конкретного оператора с общей статистикой: средняя оценка, общее количество, распределение по оценкам'
  })
  @ApiParam({ name: 'operatorId', description: 'ID оператора', type: 'string' })
  @ApiQuery({ type: GetOperatorRatingsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Оценки оператора со статистикой',
    schema: {
      type: 'object',
      properties: {
        ratings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              visitorId: { type: 'object' },
              rating: { type: 'number' },
              comment: { type: 'string' },
              detailedRating: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        averageRating: { type: 'number', example: 4.7 },
        totalRatings: { type: 'number', example: 87 },
        ratingBreakdown: {
          type: 'object',
          properties: {
            '1': { type: 'number', example: 2 },
            '2': { type: 'number', example: 3 },
            '3': { type: 'number', example: 8 },
            '4': { type: 'number', example: 25 },
            '5': { type: 'number', example: 49 }
          }
        },
        detailedAverages: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Оператор не найден' })
  async getOperatorRatings(
    @Param('operatorId', ParseObjectIdPipe) operatorId: string,
    @Query() queryDto: GetOperatorRatingsDto,
  ) {
    return this.ratingsService.getOperatorRatings(operatorId, queryDto);
  }

  @Get('operator/:operatorId/stats')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить статистику оценок оператора',
    description: 'Возвращает детальную статистику оценок оператора: средняя оценка, распределение, детализированные средние оценки по категориям'
  })
  @ApiParam({ name: 'operatorId', description: 'ID оператора', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика оценок оператора',
    schema: {
      type: 'object',
      properties: {
        averageRating: { type: 'number', example: 4.7 },
        totalRatings: { type: 'number', example: 87 },
        ratingBreakdown: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        detailedAverages: {
          type: 'object',
          properties: {
            avgProfessionalism: { type: 'number', example: 4.8 },
            avgResponseTime: { type: 'number', example: 4.6 },
            avgHelpfulness: { type: 'number', example: 4.9 },
            avgCommunication: { type: 'number', example: 4.7 },
            avgProblemResolution: { type: 'number', example: 4.5 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оператор не найден' })
  async getOperatorStats(@Param('operatorId', ParseObjectIdPipe) operatorId: string) {
    return this.ratingsService.calculateOperatorStats(operatorId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить общую статистику оценок',
    description: 'Возвращает общую статистику по всем оценкам: распределение оценок, средние показатели, топ операторов'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Общая статистика оценок',
    schema: {
      type: 'object',
      properties: {
        overall: {
          type: 'object',
          properties: {
            totalRatings: { type: 'number', example: 456 },
            averageRating: { type: 'number', example: 4.3 },
            minRating: { type: 'number', example: 1 },
            maxRating: { type: 'number', example: 5 }
          }
        },
        distribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'number', example: 5 },
              count: { type: 'number', example: 234 }
            }
          }
        },
        topOperators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              averageRating: { type: 'number', example: 4.9 },
              totalRatings: { type: 'number', example: 47 },
              operator: { type: 'object' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async getStats() {
    return this.ratingsService.getRatingStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить оценку по ID',
    description: 'Возвращает детальную информацию о конкретной оценке. Посетители могут видеть только свои оценки'
  })
  @ApiParam({ name: 'id', description: 'ID оценки', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Детали оценки',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        operatorId: { type: 'object' },
        visitorId: { type: 'object' },
        rating: { type: 'number' },
        comment: { type: 'string' },
        relatedQuestionId: { type: 'object' },
        relatedConversationId: { type: 'object' },
        detailedRating: {
          type: 'object',
          properties: {
            professionalism: { type: 'number' },
            responseTime: { type: 'number' },
            helpfulness: { type: 'number' },
            communication: { type: 'number' },
            problemResolution: { type: 'number' }
          }
        },
        isAnonymous: { type: 'boolean' },
        isVisible: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        hiddenBy: { type: 'object' },
        hiddenReason: { type: 'string' },
        hiddenAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет доступа к этой оценке' })
  @ApiResponse({ status: 404, description: 'Оценка не найдена' })
  async findById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const rating = await this.ratingsService.findById(id);
    
    // Посетитель может видеть только свои оценки
    if (req.user.role === UserRole.VISITOR && rating.visitorId.toString() !== req.user._id.toString()) {
      throw new Error('Нет доступа');
    }
    
    return rating;
  }

  @Put(':id/hide')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Скрыть оценку',
    description: 'Позволяет администратору скрыть оценку от публичного просмотра с указанием причины (например, неподобающий контент)'
  })
  @ApiParam({ name: 'id', description: 'ID оценки', type: 'string' })
  @ApiBody({ type: HideRatingDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Оценка успешно скрыта',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        isVisible: { type: 'boolean', example: false },
        hiddenBy: { type: 'object' },
        hiddenReason: { type: 'string' },
        hiddenAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оценка не найдена' })
  async hideRating(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() hideDto: HideRatingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ratingsService.hideRating(id, hideDto, req.user._id.toString());
  }

  @Put(':id/visibility')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Управление видимостью оценки',
    description: 'Позволяет администратору скрыть или показать оценку. При скрытии можно указать причину, при показе - причина сбрасывается'
  })
  @ApiParam({ name: 'id', description: 'ID оценки', type: 'string' })
  @ApiBody({ type: UpdateRatingVisibilityDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Видимость оценки успешно обновлена',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        isVisible: { type: 'boolean' },
        hiddenBy: { type: 'object' },
        hiddenReason: { type: 'string' },
        hiddenAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оценка не найдена' })
  async updateVisibility(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateRatingVisibilityDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ratingsService.updateVisibility(id, updateDto, req.user._id.toString());
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Удалить оценку',
    description: 'Удаляет оценку из системы. Операция необратима и повлияет на статистику оператора'
  })
  @ApiParam({ name: 'id', description: 'ID оценки', type: 'string' })
  @ApiResponse({ status: 204, description: 'Оценка успешно удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оценка не найдена' })
  async deleteRating(@Param('id', ParseObjectIdPipe) id: string) {
    await this.ratingsService.deleteRating(id);
  }
}
