import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../database/schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { MulterFile } from './interfaces/multer-file.interface';


@ApiTags('Профиль пользователя')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получить свой профиль' })
  @ApiResponse({ status: 200, description: 'Профиль получен' })
  async getMyProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.getProfile(user._id.toString());
  }

  @Put()
  @ApiOperation({ summary: 'Обновить свой профиль' })
  @ApiResponse({ status: 200, description: 'Профиль обновлен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async updateMyProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      user._id.toString(),
      updateProfileDto,
    );
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Загрузить аватар' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Файл аватара',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Аватар загружен' })
  @ApiResponse({ status: 400, description: 'Некорректный файл' })
  async uploadAvatar(
    @CurrentUser() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: MulterFile,
  ) {
    return this.usersService.uploadAvatar(user._id.toString(), file);
  }

  @Get('online-status')
  @ApiOperation({ summary: 'Получить статус онлайн' })
  @ApiResponse({ status: 200, description: 'Статус получен' })
  async getOnlineStatus(@CurrentUser() user: UserDocument) {
    return this.usersService.getOnlineStatus(user._id.toString());
  }

  @Put('online-status')
  @ApiOperation({ summary: 'Обновить статус онлайн' })
  @ApiResponse({ status: 200, description: 'Статус обновлен' })
  async updateOnlineStatus(
    @CurrentUser() user: UserDocument,
    @Body('isOnline') isOnline: boolean,
  ) {
    return this.usersService.updateOnlineStatus(user._id.toString(), isOnline);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику профиля' })
  @ApiResponse({ status: 200, description: 'Статистика получена' })
  async getProfileStatistics(@CurrentUser() user: UserDocument) {
    return this.usersService.getProfileStatistics(user._id.toString());
  }
}
