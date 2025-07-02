import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOperatorAssignedEmailDto {
  @ApiProperty({ description: 'Email пользователя для уведомления о назначении оператора' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Имя назначенного оператора' })
  @IsString()
  operatorName: string;

  @ApiProperty({ description: 'Текст вопроса пользователя' })
  @IsString()
  questionText: string;
}