import { IsEmail, IsString, IsJWT, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT токен для сброса пароля' 
  })
  @IsString()
  @IsJWT({ message: 'Некорректный или истекший токен' })
  token: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'Новый пароль' })
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Пароль должен содержать заглавную букву, строчную букву, цифру и специальный символ'
  })
  newPassword: string;
}