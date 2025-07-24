import { IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferChatDto {
  @ApiProperty({ description: 'ID оператора, который передает чат', required: false })
  @IsOptional()
  @IsMongoId({ message: 'fromOperatorId должен быть валидным MongoDB ID' })
  fromOperatorId?: string;

  @ApiProperty({ description: 'ID оператора, которому передается чат' })
  @IsMongoId({ message: 'toOperatorId должен быть валидным MongoDB ID' })
  toOperatorId: string;

  @ApiProperty({ description: 'ID чата для передачи' })
  @IsMongoId({ message: 'chatId должен быть валидным MongoDB ID' })
  chatId: string;

  @ApiProperty({ description: 'ID посетителя', required: false })
  @IsOptional()
  @IsMongoId({ message: 'visitorId должен быть валидным MongoDB ID' })
  visitorId?: string;

  @ApiProperty({ description: 'Причина передачи', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Дополнительная заметка', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}