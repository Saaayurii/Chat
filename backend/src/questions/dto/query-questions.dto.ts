import { IsOptional, IsEnum, IsString, IsNumber, IsDateString, IsMongoId, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionStatus, QuestionPriority, QuestionCategory } from '../../database/schemas/question.schema';

export class QueryQuestionsDto {
  @ApiProperty({ description: 'Номер страницы', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Количество записей на странице', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ enum: QuestionStatus, description: 'Фильтр по статусу', required: false })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @ApiProperty({ enum: QuestionPriority, description: 'Фильтр по приоритету', required: false })
  @IsOptional()
  @IsEnum(QuestionPriority)
  priority?: QuestionPriority;

  @ApiProperty({ enum: QuestionCategory, description: 'Фильтр по категории', required: false })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiProperty({ description: 'ID посетителя', required: false })
  @IsOptional()
  @IsMongoId()
  visitorId?: string;

  @ApiProperty({ description: 'ID оператора', required: false })
  @IsOptional()
  @IsMongoId()
  operatorId?: string;

  @ApiProperty({ description: 'Дата начала периода', required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: 'Дата окончания периода', required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Поисковый запрос по тексту вопроса', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ type: [String], description: 'Фильтр по тегам', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Только неназначенные вопросы', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  unassigned?: boolean;

  @ApiProperty({ description: 'Только просроченные вопросы', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  overdue?: boolean;

  @ApiProperty({ description: 'Поле для сортировки', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Направление сортировки', required: false, default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}