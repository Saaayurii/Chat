import { IsString, IsOptional, IsNumber, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OperatorAssignmentDto {
  @ApiProperty({ description: 'ID оператора' })
  @IsMongoId()
  operatorId: string;

  @ApiProperty({ description: 'ID чата' })
  @IsMongoId()
  chatId: string;

  @ApiProperty({ description: 'ID посетителя' })
  @IsMongoId()
  visitorId: string;

  @ApiProperty({ description: 'Тип назначения' })
  @IsEnum(['transfer', 'queue', 'direct'])
  assignmentType: 'transfer' | 'queue' | 'direct';

  @ApiProperty({ description: 'ID источника (transfer или queue)', required: false })
  @IsOptional()
  @IsMongoId()
  sourceId?: string;

  @ApiProperty({ description: 'Предполагаемое время ожидания', required: false })
  @IsOptional()
  @IsNumber()
  estimatedWait?: number;

  @ApiProperty({ description: 'Приоритет', required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class AutoAssignDto {
  @ApiProperty({ description: 'ID посетителя' })
  @IsMongoId()
  visitorId: string;

  @ApiProperty({ description: 'ID чата' })
  @IsMongoId()
  chatId: string;

  @ApiProperty({ description: 'Теги для фильтрации операторов', required: false })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Исключить операторов', required: false })
  @IsOptional()
  excludeOperators?: string[];
}