import { IsString, IsEnum, IsOptional, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionPriority, QuestionCategory } from '../../database/schemas/question.schema';

export class CreateQuestionDto {
  @ApiProperty({ description: 'Текст вопроса', maxLength: 1000 })
  @IsString()
  text: string;

  @ApiProperty({ enum: QuestionPriority, description: 'Приоритет вопроса', required: false })
  @IsOptional()
  @IsEnum(QuestionPriority)
  priority?: QuestionPriority;

  @ApiProperty({ enum: QuestionCategory, description: 'Категория вопроса', required: false })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiProperty({ type: [String], description: 'Теги для категоризации', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}