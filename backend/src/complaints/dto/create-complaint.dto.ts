import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ComplaintType, ComplaintSeverity } from '../../database/schemas/complaint.schema';

export class ComplaintEvidenceDto {
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

export class CreateComplaintDto {
  @ApiProperty({ description: 'ID оператора, на которого жалуются' })
  @IsMongoId()
  operatorId: string;

  @ApiProperty({ enum: ComplaintType, description: 'Тип жалобы' })
  @IsEnum(ComplaintType)
  type: ComplaintType;

  @ApiProperty({ description: 'Текст жалобы', maxLength: 1000 })
  @IsString()
  complaintText: string;

  @ApiProperty({ enum: ComplaintSeverity, description: 'Серьезность жалобы', required: false })
  @IsOptional()
  @IsEnum(ComplaintSeverity)
  severity?: ComplaintSeverity;

  @ApiProperty({ description: 'ID связанного вопроса', required: false })
  @IsOptional()
  @IsMongoId()
  relatedQuestionId?: string;

  @ApiProperty({ description: 'ID связанной беседы', required: false })
  @IsOptional()
  @IsMongoId()
  relatedConversationId?: string;

  @ApiProperty({ type: [ComplaintEvidenceDto], description: 'Доказательства', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplaintEvidenceDto)
  evidence?: ComplaintEvidenceDto[];
}