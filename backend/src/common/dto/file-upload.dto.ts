import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';

export enum FileType {
  AVATAR = 'avatar',
  ATTACHMENT = 'attachment',
  DOCUMENT = 'document',
}

export class FileUploadResponseDto {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export class FileUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Имя файла не может превышать 255 символов' })
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание файла не может превышать 500 символов' })
  description?: string;

  @IsOptional()
  @IsEnum(FileType)
  type?: FileType = FileType.ATTACHMENT;
}