import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { MessageType } from '../../database/schemas/message.schema';

export class SendAnonymousMessageWsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  conversationId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text: string;

  @IsOptional()
  @IsString()
  type?: MessageType = MessageType.TEXT;
}