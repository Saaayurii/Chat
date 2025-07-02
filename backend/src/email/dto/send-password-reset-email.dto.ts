import { IsEmail, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPasswordResetEmailDto {
  @ApiProperty({ description: 'Email пользователя для отправки ссылки сброса пароля' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'URL для сброса пароля' })
  @IsUrl()
  @IsString()
  resetUrl: string;
}