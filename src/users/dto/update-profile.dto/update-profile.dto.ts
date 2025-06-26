import { IsString, IsOptional, IsUrl, MaxLength, IsPhoneNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'john_doe_updated', description: 'Имя пользователя' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Имя пользователя не должно превышать 30 символов' })
  username?: string;

  @ApiPropertyOptional({ example: 'Иван Петрович Сидоров', description: 'Полное имя' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Полное имя не должно превышать 100 символов' })
  fullName?: string;

  @ApiPropertyOptional({ example: '+79001234567', description: 'Номер телефона' })
  @IsOptional()
  @IsPhoneNumber('RU', { message: 'Некорректный номер телефона' })
  phone?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/avatar.jpg', 
    description: 'URL аватара пользователя' 
  })
  @IsOptional()
  @IsUrl({}, { message: 'Некорректный URL аватара' })
  avatarUrl?: string;

  @ApiPropertyOptional({ 
    example: 'Опытный консультант с 5-летним стажем работы в технической поддержке', 
    description: 'Краткое описание пользователя' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание не должно превышать 500 символов' })
  bio?: string;
}