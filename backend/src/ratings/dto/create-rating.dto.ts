import { IsNumber, IsString, IsOptional, IsBoolean, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DetailedRatingDto {
  @ApiProperty({ description: 'Оценка профессионализма (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  professionalism: number;

  @ApiProperty({ description: 'Оценка времени ответа (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  responseTime: number;

  @ApiProperty({ description: 'Оценка полезности (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  helpfulness: number;

  @ApiProperty({ description: 'Оценка общения (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  communication: number;

  @ApiProperty({ description: 'Оценка решения проблемы (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  problemResolution: number;
}

export class CreateRatingDto {
  @ApiProperty({ description: 'ID оператора' })
  @IsMongoId()
  operatorId: string;

  @ApiProperty({ description: 'Общая оценка (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  rating: number;

  @ApiProperty({ description: 'Комментарий к оценке', maxLength: 500, required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'ID связанного вопроса', required: false })
  @IsOptional()
  @IsMongoId()
  relatedQuestionId?: string;

  @ApiProperty({ description: 'ID связанной беседы', required: false })
  @IsOptional()
  @IsMongoId()
  relatedConversationId?: string;

  @ApiProperty({ type: DetailedRatingDto, description: 'Детализированная оценка', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DetailedRatingDto)
  detailedRating?: DetailedRatingDto;

  @ApiProperty({ description: 'Анонимная оценка', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}