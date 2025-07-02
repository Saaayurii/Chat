import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from '../create-user.dto/create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  @ApiPropertyOptional({ description: 'Заблокирован ли пользователь' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Активирован ли email пользователя' })
  @IsOptional()
  @IsBoolean()
  isActivated?: boolean;

  @ApiPropertyOptional({ description: 'В черном списке у администратора' })
  @IsOptional()
  @IsBoolean()
  blacklistedByAdmin?: boolean;

  @ApiPropertyOptional({ description: 'В черном списке у оператора' })
  @IsOptional()
  @IsBoolean()
  blacklistedByOperator?: boolean;
}