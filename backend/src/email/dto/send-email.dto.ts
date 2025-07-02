import { IsEmail, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmailAttachmentDto {
  @ApiProperty({ description: 'Имя файла' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Содержимое файла в base64' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'MIME тип файла' })
  @IsString()
  contentType: string;
}

export class SendEmailDto {
  @ApiProperty({ description: 'Email получателя' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Тема письма' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Текст письма (plain text)', required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ description: 'HTML содержимое письма', required: false })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiProperty({ type: [EmailAttachmentDto], description: 'Вложения', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiProperty({ description: 'Email отправителя (переопределяет дефолтный)', required: false })
  @IsOptional()
  @IsEmail()
  from?: string;
}