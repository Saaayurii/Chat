import { IsString, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';

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
}