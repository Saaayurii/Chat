import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../database/schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123', description: 'Пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @ApiProperty({ example: 'john_doe', description: 'Имя пользователя' })
  @IsString()
  @MinLength(2, { message: 'Имя пользователя должно содержать минимум 2 символа' })
  username: string;

  @ApiPropertyOptional({ example: 'Иван Петров', description: 'Полное имя' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+79001234567', description: 'Номер телефона' })
  @IsOptional()
  @IsPhoneNumber('RU', { message: 'Некорректный номер телефона' })
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.VISITOR, description: 'Роль пользователя' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Некорректная роль пользователя' })
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Консультант по техническим вопросам', description: 'Краткое описание' })
  @IsOptional()
  @IsString()
  bio?: string;
}
