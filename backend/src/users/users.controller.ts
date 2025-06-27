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
  HttpStatus,
  HttpException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';

import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User, UserDocument } from '../database/schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto/delete-user.dto';
import { CreateOperatorDto } from './dto/create-operator.dto/create-operator.dto';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';

@ApiTags('Пользователи')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать нового пользователя (только админ)' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Post('operators')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать нового оператора (только админ)' })
  @ApiResponse({ status: 201, description: 'Оператор успешно создан' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async createOperator(@Body() createOperatorDto: CreateOperatorDto) {
    return this.usersService.createOperator(createOperatorDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Получить список пользователей' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Номер страницы',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество на странице',
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Фильтр по роли',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Поиск по email или имени',
  })
  @ApiResponse({ status: 200, description: 'Список пользователей получен' })
  async findAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllUsers({ page, limit, role, search });
  }

  @Get('operators')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Получить список операторов' })
  @ApiQuery({
    name: 'online',
    required: false,
    description: 'Только онлайн операторы',
  })
  @ApiResponse({ status: 200, description: 'Список операторов получен' })
  async findOperators(@Query('online') online?: boolean) {
    return this.usersService.findOperators(online);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить статистику пользователей (только админ)' })
  @ApiResponse({ status: 200, description: 'Статистика получена' })
  async getUsersStats() {
    return this.usersService.getUsersStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findUserById(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.usersService.findUserById(id, currentUser);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить пользователя (только админ)' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Put(':id/block')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Заблокировать/разблокировать пользователя (только админ)',
  })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Статус блокировки изменен' })
  async toggleUserBlock(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.usersService.toggleUserBlock(id, currentUser._id.toString());
  }

  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Активировать пользователя (только админ)' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь активирован' })
  async activateUser(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.activateUser(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить пользователя (только админ)' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async deleteUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() deleteUserDto: DeleteUserDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.usersService.deleteUser(
      id,
      deleteUserDto,
      currentUser._id.toString(),
    );
  }
}
