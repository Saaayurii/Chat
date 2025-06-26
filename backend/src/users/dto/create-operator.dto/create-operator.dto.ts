import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperatorDto {
  @ApiProperty({ example: 'operator@example.com', description: 'Email оператора' })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @ApiProperty({ example: 'operator_ivan', description: 'Имя пользователя оператора' })
  @IsString()
  @MinLength(3, { message: 'Имя пользователя должно содержать минимум 3 символа' })
  username: string;

  @ApiProperty({ example: 'Иван Петров', description: 'Полное имя оператора' })
  @IsString()
  @MinLength(2, { message: 'Полное имя должно содержать минимум 2 символа' })
  fullName: string;

  @ApiPropertyOptional({ example: '+79001234567', description: 'Номер телефона оператора' })
  @IsOptional()
  @IsPhoneNumber('RU', { message: 'Некорректный номер телефона' })
  phone?: string;

  @ApiPropertyOptional({ 
    example: 'Специалист по техническим вопросам и консультациям клиентов', 
    description: 'Описание специализации оператора' 
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ 
    example: 'TempPassword123', 
    description: 'Временный пароль (если не указан, будет сгенерирован автоматически)' 
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Временный пароль должен содержать минимум 8 символов' })
  temporaryPassword?: string;
}