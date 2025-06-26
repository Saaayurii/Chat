import { IsString, IsJWT } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT токен для подтверждения email' 
  })
  @IsString()
  @IsJWT({ message: 'Некорректный токен подтверждения' })
  token: string;
}