import { 
  Controller, 
  Post, 
  Put, 
  Get, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { TransferChatDto } from './dto/transfer-chat.dto';
import { AcceptTransferDto } from './dto/accept-transfer.dto';
import { AddToQueueDto } from './dto/queue-position.dto';
import { AutoAssignDto } from './dto/operator-assignment.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TransferPermissionGuard } from './guards/transfer-permission.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('transfer')
@Controller('transfer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('request')
  @UseGuards(TransferPermissionGuard)
  @ApiOperation({ summary: 'Запрос на перенаправление чата' })
  @ApiResponse({ status: 201, description: 'Запрос на перенаправление создан' })
  async requestTransfer(@Body() transferData: TransferChatDto) {
    return this.transferService.requestTransfer(transferData);
  }

  @Put('respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ответ на запрос перенаправления' })
  @ApiResponse({ status: 200, description: 'Ответ на запрос обработан' })
  async respondToTransfer(@Body() responseData: AcceptTransferDto) {
    return this.transferService.respondToTransfer(responseData);
  }

  @Post('queue/add')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Добавить посетителя в очередь' })
  @ApiResponse({ status: 201, description: 'Посетитель добавлен в очередь' })
  async addToQueue(@Body() queueData: AddToQueueDto) {
    return this.transferService.addToQueue(queueData);
  }

  @Get('queue/position/:queueId')
  @ApiOperation({ summary: 'Получить позицию в очереди' })
  @ApiResponse({ status: 200, description: 'Позиция в очереди получена' })
  async getQueuePosition(@Param('queueId', ParseObjectIdPipe) queueId: string) {
    return this.transferService.getQueuePosition(queueId);
  }

  @Post('queue/assign/:operatorId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Назначить следующего из очереди оператору' })
  @ApiResponse({ status: 200, description: 'Назначение выполнено' })
  async assignFromQueue(@Param('operatorId', ParseObjectIdPipe) operatorId: string) {
    return this.transferService.assignFromQueue(operatorId);
  }

  @Post('auto-assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Автоматическое назначение оператора' })
  @ApiResponse({ status: 200, description: 'Автоматическое назначение выполнено' })
  async autoAssignOperator(@Body() assignmentData: AutoAssignDto) {
    return this.transferService.autoAssignOperator(assignmentData);
  }

  @Get('history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить историю перенаправлений' })
  @ApiResponse({ status: 200, description: 'История перенаправлений получена' })
  async getTransferHistory(
    @Request() req: any,
    @Query('limit') limit: string = '10'
  ) {
    const operatorId = req.user.role === UserRole.ADMIN ? req.query.operatorId : req.user.id;
    return this.transferService.getTransferHistory(operatorId, parseInt(limit));
  }

  @Get('queue/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить статистику очереди' })
  @ApiResponse({ status: 200, description: 'Статистика очереди получена' })
  async getQueueStats() {
    return this.transferService.getQueueStats();
  }

  @Delete('cancel/:transferId')
  @UseGuards(TransferPermissionGuard)
  @ApiOperation({ summary: 'Отменить запрос на перенаправление' })
  @ApiResponse({ status: 200, description: 'Запрос на перенаправление отменен' })
  async cancelTransfer(@Param('transferId', ParseObjectIdPipe) transferId: string) {
    return this.transferService.cancelTransfer(transferId);
  }

  @Delete('queue/remove/:queueId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить из очереди' })
  @ApiResponse({ status: 200, description: 'Посетитель удален из очереди' })
  async removeFromQueue(@Param('queueId', ParseObjectIdPipe) queueId: string) {
    return this.transferService.removeFromQueue(queueId);
  }

  @Get('my-transfers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR)
  @ApiOperation({ summary: 'Получить мои активные перенаправления' })
  @ApiResponse({ status: 200, description: 'Активные перенаправления получены' })
  async getMyTransfers(@Request() req: any) {
    return this.transferService.getTransferHistory(req.user.id, 20);
  }

  @Post('bulk-assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Массовое назначение из очереди' })
  @ApiResponse({ status: 200, description: 'Массовое назначение выполнено' })
  async bulkAssignFromQueue(@Body() operatorIds: string[]) {
    const assignments: any[] = [];
    for (const operatorId of operatorIds) {
      const assignment = await this.transferService.assignFromQueue(operatorId);
      if (assignment) {
        assignments.push(assignment);
      }
    }
    return assignments;
  }
}