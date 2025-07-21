import { IsString, IsOptional, IsUUID, MaxLength, MinLength, IsMongoId } from 'class-validator';

export class CreateAnonymousConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  visitorName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  initialMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsUUID()
  sessionId: string; // Уникальный идентификатор сессии посетителя

  // Для авторизованных пользователей
  @IsOptional()
  @IsMongoId()
  userId?: string; // ID авторизованного пользователя

  @IsOptional()
  @IsString()
  userRole?: string; // Роль пользователя
}