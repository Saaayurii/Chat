import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ArrayMinSize, IsMongoId } from 'class-validator';
import { ConversationType } from '../../../database/schemas/conversation.schema';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Должен быть хотя бы один участник беседы' })
  @IsMongoId({ each: true, message: 'Каждый участник должен иметь валидный ID' })
  participantIds: string[];

  @IsEnum(ConversationType)
  @IsNotEmpty()
  type: ConversationType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
