import { IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferChatDto {
  @ApiProperty({ description: 'ID оператора, который передает чат' })
  @IsMongoId()
  fromOperatorId: string;

  @ApiProperty({ description: 'ID оператора, которому передается чат' })
  @IsMongoId()
  toOperatorId: string;

  @ApiProperty({ description: 'ID чата для передачи' })
  @IsMongoId()
  chatId: string;

  @ApiProperty({ description: 'ID посетителя' })
  @IsMongoId()
  visitorId: string;

  @ApiProperty({ description: 'Причина передачи', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Дополнительная заметка', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}