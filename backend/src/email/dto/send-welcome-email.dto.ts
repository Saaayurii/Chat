import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWelcomeEmailDto {
  @ApiProperty({ description: 'Email пользователя для отправки приветственного письма' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Имя пользователя для персонализации письма' })
  @IsString()
  username: string;
}