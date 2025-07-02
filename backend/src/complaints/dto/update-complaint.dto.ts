import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ComplaintStatus, ComplaintSeverity } from '../../database/schemas/complaint.schema';

export class UpdateComplaintDto {
  @ApiProperty({ enum: ComplaintStatus, description: 'Статус жалобы', required: false })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiProperty({ enum: ComplaintSeverity, description: 'Серьезность жалобы', required: false })
  @IsOptional()
  @IsEnum(ComplaintSeverity)
  severity?: ComplaintSeverity;

  @ApiProperty({ description: 'Ответ администратора', maxLength: 1000, required: false })
  @IsOptional()
  @IsString()
  adminResponse?: string;

  @ApiProperty({ description: 'Заметки о решении', maxLength: 500, required: false })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ description: 'Оператор предупрежден', required: false })
  @IsOptional()
  @IsBoolean()
  operatorWarned?: boolean;

  @ApiProperty({ description: 'Оператор приостановлен', required: false })
  @IsOptional()
  @IsBoolean()
  operatorSuspended?: boolean;

  @ApiProperty({ description: 'Длительность приостановки в днях', required: false })
  @IsOptional()
  @IsNumber()
  suspensionDuration?: number;

  @ApiProperty({ description: 'Требуется последующий контроль', required: false })
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @ApiProperty({ description: 'Дата последующего контроля', required: false })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

export class ReviewComplaintDto {
  @ApiProperty({ enum: ComplaintStatus, description: 'Решение по жалобе' })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiProperty({ description: 'Ответ администратора', maxLength: 1000 })
  @IsString()
  adminResponse: string;

  @ApiProperty({ description: 'Заметки о решении', maxLength: 500, required: false })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ description: 'Предупредить оператора', required: false })
  @IsOptional()
  @IsBoolean()
  warnOperator?: boolean;

  @ApiProperty({ description: 'Приостановить оператора', required: false })
  @IsOptional()
  @IsBoolean()
  suspendOperator?: boolean;

  @ApiProperty({ description: 'Длительность приостановки в днях', required: false })
  @IsOptional()
  @IsNumber()
  suspensionDuration?: number;
}