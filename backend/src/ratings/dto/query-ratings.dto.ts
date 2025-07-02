import { IsOptional, IsNumber, IsString, IsDateString, IsMongoId, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryRatingsDto {
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

  @ApiProperty({ description: 'ID оператора', required: false })
  @IsOptional()
  @IsMongoId()
  operatorId?: string;

  @ApiProperty({ description: 'ID посетителя', required: false })
  @IsOptional()
  @IsMongoId()
  visitorId?: string;

  @ApiProperty({ description: 'Минимальная оценка', minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @ApiProperty({ description: 'Максимальная оценка', minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRating?: number;

  @ApiProperty({ description: 'Только видимые оценки', required: false, default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isVisible?: boolean = true;

  @ApiProperty({ description: 'Дата начала периода', required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: 'Дата окончания периода', required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Поисковый запрос по комментарию', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Поле для сортировки', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Направление сортировки', required: false, default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class GetOperatorRatingsDto {
  @ApiProperty({ description: 'ID оператора' })
  @IsMongoId()
  operatorId: string;

  @ApiProperty({ description: 'Количество последних оценок', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}