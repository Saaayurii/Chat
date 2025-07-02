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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto, AssignOperatorDto, TransferQuestionDto, CloseQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthenticatedRequest } from '../common/interfaces/auth-request.interface';
import { UserRole } from '../database/schemas/user.schema';

@ApiTags('Questions')
@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Создать вопрос',
    description: 'Позволяет посетителю создать новый вопрос для операторов'
  })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Вопрос успешно создан',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        text: { type: 'string', example: 'Как изменить пароль?' },
        priority: { type: 'string', example: 'medium' },
        category: { type: 'string', example: 'account' },
        status: { type: 'string', example: 'open' },
        createdAt: { type: 'string', format: 'date-time' },
        visitorId: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные вопроса' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async createQuestion(
    @Body() createDto: CreateQuestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.questionsService.createQuestion(createDto, req.user._id.toString());
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить список вопросов',
    description: 'Возвращает отфильтрованный и отсортированный список вопросов с пагинацией'
  })
  @ApiQuery({ type: QueryQuestionsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Список вопросов получен',
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              text: { type: 'string' },
              status: { type: 'string' },
              priority: { type: 'string' },
              category: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              visitorId: { type: 'object' },
              operatorId: { type: 'object' }
            }
          }
        },
        total: { type: 'number', example: 150 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findAll(@Query() queryDto: QueryQuestionsDto) {
    return this.questionsService.findAll(queryDto);
  }

  @Get('my')
  @Roles(UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить мои вопросы',
    description: 'Возвращает все вопросы текущего посетителя'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список вопросов пользователя',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          text: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string' },
          category: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          operatorId: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async findMyQuestions(@Request() req: AuthenticatedRequest) {
    return this.questionsService.findByUserId(req.user._id.toString());
  }

  @Get('operator/:operatorId/workload')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить нагрузку оператора',
    description: 'Возвращает статистику рабочей нагрузки конкретного оператора'
  })
  @ApiParam({ name: 'operatorId', description: 'ID оператора', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика нагрузки оператора',
    schema: {
      type: 'object',
      properties: {
        activeQuestions: { type: 'number', example: 5 },
        totalQuestions: { type: 'number', example: 87 },
        closedToday: { type: 'number', example: 3 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Оператор не найден' })
  async getOperatorWorkload(@Param('operatorId', ParseObjectIdPipe) operatorId: string) {
    return this.questionsService.getOperatorWorkload(operatorId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить статистику вопросов',
    description: 'Возвращает общую статистику по вопросам: распределение по статусам, приоритетам, категориям'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика вопросов',
    schema: {
      type: 'object',
      properties: {
        statusStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'open' },
              count: { type: 'number', example: 25 }
            }
          }
        },
        priorityStats: { type: 'array' },
        categoryStats: { type: 'array' },
        avgResponseTime: { type: 'number', example: 15.5 },
        avgResolutionTime: { type: 'number', example: 120.3 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async getStats() {
    return this.questionsService.getQuestionStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Получить вопрос по ID',
    description: 'Возвращает детальную информацию о вопросе. Посетители могут видеть только свои вопросы, операторы - только назначенные им'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Детали вопроса',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        text: { type: 'string' },
        status: { type: 'string' },
        priority: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        assignedAt: { type: 'string', format: 'date-time' },
        firstResponseAt: { type: 'string', format: 'date-time' },
        closedAt: { type: 'string', format: 'date-time' },
        visitorId: { type: 'object' },
        operatorId: { type: 'object' },
        closedBy: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет доступа к этому вопросу' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async findById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const question = await this.questionsService.findById(id);
    
    // Посетитель может видеть только свои вопросы
    if (req.user.role === UserRole.VISITOR && question.visitorId.toString() !== req.user._id.toString()) {
      throw new Error('Нет доступа');
    }
    
    // Оператор может видеть только назначенные ему вопросы
    if (req.user.role === UserRole.OPERATOR && 
        question.operatorId && 
        question.operatorId.toString() !== req.user._id.toString()) {
      throw new Error('Нет доступа');
    }
    
    return question;
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Назначить оператора на вопрос',
    description: 'Назначает оператора на открытый вопрос и отправляет уведомление посетителю'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiBody({ type: AssignOperatorDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Оператор успешно назначен',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string', example: 'assigned' },
        operatorId: { type: 'object' },
        assignedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Можно назначить оператора только на открытый вопрос' })
  @ApiResponse({ status: 404, description: 'Вопрос или оператор не найден' })
  async assignOperator(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() assignDto: AssignOperatorDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.questionsService.assignOperator(id, assignDto, req.user._id.toString());
  }

  @Put(':id/transfer')
  @Roles(UserRole.OPERATOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Передать вопрос другому оператору',
    description: 'Позволяет оператору передать назначенный ему вопрос другому оператору с указанием причины'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiBody({ type: TransferQuestionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Вопрос успешно передан',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string', example: 'transferred' },
        operatorId: { type: 'object' },
        transferHistory: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Можно передать только назначенный вам вопрос' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async transferQuestion(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() transferDto: TransferQuestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.questionsService.transferQuestion(id, transferDto, req.user._id.toString());
  }

  @Put(':id/close')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Закрыть вопрос',
    description: 'Закрывает вопрос с возможностью добавления комментария. Автоматически рассчитывается время решения'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiBody({ type: CloseQuestionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Вопрос успешно закрыт',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        status: { type: 'string', example: 'closed' },
        closedAt: { type: 'string', format: 'date-time' },
        closedBy: { type: 'object' },
        resolutionTimeMinutes: { type: 'number', example: 45 }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Вопрос уже закрыт' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async closeQuestion(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() closeDto: CloseQuestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.questionsService.closeQuestion(id, closeDto, req.user._id.toString());
  }

  @Put(':id/first-response')
  @Roles(UserRole.OPERATOR)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Отметить первый ответ',
    description: 'Отмечает время первого ответа оператора и переводит вопрос в статус "в работе"'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Первый ответ отмечен',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Первый ответ отмечен' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async markFirstResponse(@Param('id', ParseObjectIdPipe) id: string) {
    await this.questionsService.markFirstResponse(id);
    return { message: 'Первый ответ отмечен' };
  }

  @Put(':id/increment-messages')
  @Roles(UserRole.OPERATOR, UserRole.VISITOR)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Увеличить счетчик сообщений',
    description: 'Увеличивает счетчик сообщений в вопросе на 1'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Счетчик сообщений увеличен',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Счетчик сообщений увеличен' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async incrementMessagesCount(@Param('id', ParseObjectIdPipe) id: string) {
    await this.questionsService.incrementMessagesCount(id);
    return { message: 'Счетчик сообщений увеличен' };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ 
    summary: 'Обновить вопрос',
    description: 'Позволяет администратору обновить данные вопроса: статус, приоритет, категорию, теги'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Вопрос успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        text: { type: 'string' },
        status: { type: 'string' },
        priority: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async updateQuestion(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Удалить вопрос',
    description: 'Удаляет вопрос из системы. Операция необратима'
  })
  @ApiParam({ name: 'id', description: 'ID вопроса', type: 'string' })
  @ApiResponse({ status: 204, description: 'Вопрос успешно удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Вопрос не найден' })
  async deleteQuestion(@Param('id', ParseObjectIdPipe) id: string) {
    await this.questionsService.deleteQuestion(id);
  }
}
