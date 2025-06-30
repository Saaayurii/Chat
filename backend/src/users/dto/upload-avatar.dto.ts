import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadAvatarDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Альтернативный текст не может превышать 255 символов' })
  altText?: string;
}

export class UploadAvatarResponseDto {
  avatarUrl: string;
  uploadedAt: Date;
  fileSize: number;
}