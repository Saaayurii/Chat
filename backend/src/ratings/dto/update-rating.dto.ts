import { IsBoolean, IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRatingVisibilityDto {
  @ApiProperty({ description: 'Видимость оценки' })
  @IsBoolean()
  isVisible: boolean;

  @ApiProperty({ description: 'Причина скрытия', required: false })
  @IsOptional()
  @IsString()
  hiddenReason?: string;
}

export class HideRatingDto {
  @ApiProperty({ description: 'Причина скрытия' })
  @IsString()
  hiddenReason: string;
}