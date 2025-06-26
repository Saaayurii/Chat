import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteUserDto {
  @ApiPropertyOptional({ 
    example: 'Нарушение правил сервиса, спам в чате', 
    description: 'Причина удаления пользователя' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Причина удаления не должна превышать 300 символов' })
  reason?: string;

  @ApiPropertyOptional({ 
    example: 'Пользователь будет заблокирован и его данные архивированы', 
    description: 'Дополнительная информация об удалении' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Дополнительная информация не должна превышать 500 символов' })
  additionalInfo?: string;
}