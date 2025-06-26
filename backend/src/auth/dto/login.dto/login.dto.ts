import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Пароль' })
  @IsString()
  password: string;
}