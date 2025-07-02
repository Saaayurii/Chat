import { IsEmail, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendRatingRequestEmailDto {
  @ApiProperty({ description: 'Email пользователя для запроса оценки' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Имя оператора для оценки' })
  @IsString()
  operatorName: string;

  @ApiProperty({ description: 'URL для оставления оценки' })
  @IsUrl()
  @IsString()
  ratingUrl: string;
}