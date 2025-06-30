import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { MessageType } from '../../../database/schemas/message.schema';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Сообщение не может превышать 2000 символов' })
  text: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  senderId?: string; // Заполняется автоматически в gateway
}
