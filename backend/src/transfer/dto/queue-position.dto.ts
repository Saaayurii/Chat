import { IsNumber, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueuePositionDto {
  @ApiProperty({ description: 'ID очереди' })
  @IsMongoId()
  queueId: string;

  @ApiProperty({ description: 'Позиция в очереди' })
  @IsNumber()
  position: number;

  @ApiProperty({ description: 'Предполагаемое время ожидания (в секундах)' })
  @IsNumber()
  estimatedWait: number;

  @ApiProperty({ description: 'Общее количество в очереди' })
  @IsNumber()
  totalInQueue: number;
}

export class AddToQueueDto {
  @ApiProperty({ description: 'ID посетителя' })
  @IsMongoId()
  visitorId: string;

  @ApiProperty({ description: 'ID чата' })
  @IsMongoId()
  chatId: string;

  @ApiProperty({ description: 'Приоритет (0-10)', required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'Теги для фильтрации', required: false })
  @IsOptional()
  tags?: string[];
}