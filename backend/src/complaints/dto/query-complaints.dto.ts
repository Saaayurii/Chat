import { IsOptional, IsEnum, IsString, IsNumber, IsDateString, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ComplaintStatus, ComplaintType, ComplaintSeverity } from '../../database/schemas/complaint.schema';

export class QueryComplaintsDto {
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

  @ApiProperty({ enum: ComplaintStatus, description: 'Фильтр по статусу', required: false })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiProperty({ enum: ComplaintType, description: 'Фильтр по типу', required: false })
  @IsOptional()
  @IsEnum(ComplaintType)
  type?: ComplaintType;

  @ApiProperty({ enum: ComplaintSeverity, description: 'Фильтр по серьезности', required: false })
  @IsOptional()
  @IsEnum(ComplaintSeverity)
  severity?: ComplaintSeverity;

  @ApiProperty({ description: 'ID посетителя', required: false })
  @IsOptional()
  @IsMongoId()
  visitorId?: string;

  @ApiProperty({ description: 'ID оператора', required: false })
  @IsOptional()
  @IsMongoId()
  operatorId?: string;

  @ApiProperty({ description: 'ID рассматривавшего администратора', required: false })
  @IsOptional()
  @IsMongoId()
  reviewedBy?: string;

  @ApiProperty({ description: 'Дата начала периода', required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: 'Дата окончания периода', required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Поисковый запрос по тексту жалобы', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Только нерассмотренные жалобы', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  unreviewed?: boolean;

  @ApiProperty({ description: 'Требуют последующего контроля', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  followUpRequired?: boolean;

  @ApiProperty({ description: 'Поле для сортировки', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Направление сортировки', required: false, default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}