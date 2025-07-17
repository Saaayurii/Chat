import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Публичные пользователи')
@Controller('public/users')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('operators')
  @ApiOperation({ summary: 'Получить операторов (публичный endpoint)' })
  @ApiResponse({ status: 200, description: 'Список операторов' })
  @ApiQuery({
    name: 'online',
    required: false,
    description: 'Только онлайн операторы',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Максимальное количество операторов',
  })
  async getOperators(
    @Query('online') online?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const isOnlineFilter = online === 'true';
    const operators = await this.usersService.findOperators(isOnlineFilter);
    
    // Проверяем что operators это массив
    const operatorsArray = Array.isArray(operators) ? operators : [];
    
    // Логирование для отладки
    console.log(`[PublicUsersController] Запрос операторов: online=${isOnlineFilter}, limit=${limit}`);
    console.log(`[PublicUsersController] Найдено операторов: ${operatorsArray.length}`);
    
    if (operatorsArray.length > 0) {
      operatorsArray.forEach((op, index) => {
        console.log(`[PublicUsersController] Оператор ${index + 1}: ID=${op._id}, Name=${op.profile?.fullName || op.profile?.username}, Online=${op.profile?.isOnline}`);
      });
    }
    
    // Применяем лимит если указан
    const limitedOperators = limit ? operatorsArray.slice(0, limit) : operatorsArray;
    
    // Возвращаем в формате, ожидаемом фронтендом
    return {
      operators: limitedOperators,
      total: operatorsArray.length
    };
  }
}