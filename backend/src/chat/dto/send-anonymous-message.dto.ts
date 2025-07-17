import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, IsUUID } from 'class-validator';
import { MessageType } from '../../database/schemas/message.schema';

export class SendAnonymousMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Сообщение не может превышать 2000 символов' })
  text: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @IsString()
  @IsUUID()
  sessionId: string; // Идентификатор сессии для связи с анонимным пользователем

  @IsOptional()
  @IsString()
  @MaxLength(50)
  senderName?: string; // Имя отправителя для анонимных пользователей
}