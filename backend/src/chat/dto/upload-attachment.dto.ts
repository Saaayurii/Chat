import { IsNotEmpty, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadAttachmentDto {
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание файла не может превышать 500 символов' })
  description?: string;
}