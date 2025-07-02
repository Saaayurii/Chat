import { IsString, IsEnum, IsOptional, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionStatus, QuestionPriority, QuestionCategory } from '../../database/schemas/question.schema';

export class UpdateQuestionDto {
  @ApiProperty({ enum: QuestionStatus, description: 'Статус вопроса', required: false })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

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

  @ApiProperty({ description: 'Внутренние заметки оператора', required: false })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ description: 'ID беседы', required: false })
  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}

export class AssignOperatorDto {
  @ApiProperty({ description: 'ID оператора для назначения' })
  @IsMongoId()
  operatorId: string;

  @ApiProperty({ description: 'Комментарий к назначению', required: false })
  @IsOptional()
  @IsString()
  assignmentComment?: string;
}

export class TransferQuestionDto {
  @ApiProperty({ description: 'ID оператора, которому передается вопрос' })
  @IsMongoId()
  toOperatorId: string;

  @ApiProperty({ description: 'Причина передачи' })
  @IsString()
  reason: string;
}

export class CloseQuestionDto {
  @ApiProperty({ description: 'Комментарий к закрытию', required: false })
  @IsOptional()
  @IsString()
  closingComment?: string;
}