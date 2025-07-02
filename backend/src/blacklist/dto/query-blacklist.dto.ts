import { IsOptional, IsEnum, IsString, IsNumber, IsDateString, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BlacklistReason, BlacklistType, BlacklistStatus } from '../../database/schemas/blacklist-entry.schema';

export class QueryBlacklistDto {
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

  @ApiProperty({ enum: BlacklistStatus, description: 'Фильтр по статусу', required: false })
  @IsOptional()
  @IsEnum(BlacklistStatus)
  status?: BlacklistStatus;

  @ApiProperty({ enum: BlacklistReason, description: 'Фильтр по причине', required: false })
  @IsOptional()
  @IsEnum(BlacklistReason)
  reason?: BlacklistReason;

  @ApiProperty({ enum: BlacklistType, description: 'Фильтр по типу', required: false })
  @IsOptional()
  @IsEnum(BlacklistType)
  type?: BlacklistType;

  @ApiProperty({ description: 'ID пользователя', required: false })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiProperty({ description: 'ID заблокировавшего', required: false })
  @IsOptional()
  @IsMongoId()
  blockedBy?: string;

  @ApiProperty({ description: 'Только одобренные администратором', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  approvedByAdmin?: boolean;

  @ApiProperty({ description: 'Дата начала периода', required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: 'Дата окончания периода', required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Поисковый запрос по описанию', required: false })
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