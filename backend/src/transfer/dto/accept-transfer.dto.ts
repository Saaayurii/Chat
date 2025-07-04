import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptTransferDto {
  @ApiProperty({ description: 'ID запроса на передачу' })
  @IsMongoId()
  transferId: string;

  @ApiProperty({ description: 'Принят или отклонен запрос' })
  @IsBoolean()
  accepted: boolean;

  @ApiProperty({ description: 'Причина отклонения (если отклонен)', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}