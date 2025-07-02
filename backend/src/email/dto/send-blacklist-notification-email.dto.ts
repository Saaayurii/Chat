import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendBlacklistNotificationEmailDto {
  @ApiProperty({ description: 'Email пользователя для уведомления о блокировке' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Причина добавления в черный список' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Длительность блокировки (опционально)', required: false })
  @IsOptional()
  @IsString()
  duration?: string;
}