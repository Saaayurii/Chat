import { IsString, IsEnum, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlacklistStatus } from '../../database/schemas/blacklist-entry.schema';

export class UpdateBlacklistEntryDto {
  @ApiProperty({ enum: BlacklistStatus, description: 'Статус блокировки', required: false })
  @IsOptional()
  @IsEnum(BlacklistStatus)
  status?: BlacklistStatus;

  @ApiProperty({ description: 'Одобрено администратором', required: false })
  @IsOptional()
  @IsBoolean()
  approvedByAdmin?: boolean;

  @ApiProperty({ description: 'Причина отмены блокировки', maxLength: 300, required: false })
  @IsOptional()
  @IsString()
  revocationReason?: string;
}

export class ApproveBlacklistEntryDto {
  @ApiProperty({ description: 'Одобрить блокировку' })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ description: 'Комментарий администратора', required: false })
  @IsOptional()
  @IsString()
  adminComment?: string;
}

export class RevokeBlacklistEntryDto {
  @ApiProperty({ description: 'Причина отмены блокировки', maxLength: 300 })
  @IsString()
  revocationReason: string;
}