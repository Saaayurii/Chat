import { IsString, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BlacklistReason, BlacklistType } from '../../database/schemas/blacklist-entry.schema';

export class EvidenceDto {
  @ApiProperty({ description: 'Тип доказательства' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'URL файла доказательства' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Описание доказательства', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBlacklistEntryDto {
  @ApiProperty({ description: 'ID пользователя для блокировки' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: BlacklistReason, description: 'Причина блокировки' })
  @IsEnum(BlacklistReason)
  reason: BlacklistReason;

  @ApiProperty({ description: 'Описание причины блокировки', maxLength: 500 })
  @IsString()
  description: string;

  @ApiProperty({ enum: BlacklistType, description: 'Тип блокировки', required: false })
  @IsOptional()
  @IsEnum(BlacklistType)
  type?: BlacklistType;

  @ApiProperty({ description: 'Серьезность нарушения (1-5)', minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  severity?: number;

  @ApiProperty({ type: [String], description: 'ID связанных жалоб', required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  relatedComplaints?: string[];

  @ApiProperty({ type: [String], description: 'ID связанных сообщений', required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  relatedMessages?: string[];

  @ApiProperty({ type: [EvidenceDto], description: 'Доказательства нарушения', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto[];
}