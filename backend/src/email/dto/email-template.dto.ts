import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EmailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  OPERATOR_ASSIGNED = 'operator_assigned',
  QUESTION_ANSWERED = 'question_answered',
  COMPLAINT_RECEIVED = 'complaint_received',
  BLACKLIST_NOTIFICATION = 'blacklist_notification',
  RATING_REQUEST = 'rating_request',
}

export class SendTemplateEmailDto {
  @ApiProperty({ description: 'Email получателя' })
  @IsString()
  to: string;

  @ApiProperty({ enum: EmailTemplate, description: 'Тип шаблона письма' })
  @IsEnum(EmailTemplate)
  template: EmailTemplate;

  @ApiProperty({ description: 'Переменные для подстановки в шаблон', required: false })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiProperty({ description: 'Язык шаблона', required: false, default: 'ru' })
  @IsOptional()
  @IsString()
  language?: string;
}