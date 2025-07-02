import { IsEmail, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailVerificationDto {
  @ApiProperty({ description: 'Email пользователя для отправки ссылки подтверждения' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'URL для подтверждения email' })
  @IsUrl()
  @IsString()
  verificationUrl: string;
}