import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @ApiProperty({ example: 'john_doe', description: 'Имя пользователя' })
  @IsString()
  @MinLength(3, { message: 'Имя пользователя должно содержать минимум 3 символа' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Имя пользователя может содержать только буквы, цифры, _ и -' })
  username: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Пароль (минимум 8 символов)' })
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Пароль должен содержать заглавную букву, строчную букву, цифру и специальный символ'
  })
  password: string;

  @ApiProperty({ example: 'Иван Петров', description: 'Полное имя (опционально)' })
  @IsString()
  fullName?: string;
}