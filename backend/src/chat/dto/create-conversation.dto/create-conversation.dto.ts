import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ArrayMinSize, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from '../../../database/schemas/conversation.schema';

export class CreateConversationDto {
  @ApiProperty({ description: 'IDs участников беседы', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Должен быть хотя бы один участник беседы' })
  @IsMongoId({ each: true, message: 'Каждый участник должен иметь валидный ID' })
  participantIds: string[];

  @ApiProperty({ enum: ConversationType, description: 'Тип беседы' })
  @IsEnum(ConversationType)
  @IsNotEmpty()
  type: ConversationType;

  @ApiProperty({ description: 'Заголовок беседы', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Описание беседы', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID создателя беседы' })
  @IsMongoId()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({ description: 'ID связанного вопроса', required: false })
  @IsOptional()
  @IsMongoId()
  relatedQuestionId?: string;
}
