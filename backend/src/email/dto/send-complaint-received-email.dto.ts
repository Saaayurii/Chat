import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendComplaintReceivedEmailDto {
  @ApiProperty({ description: 'Email пользователя для уведомления о принятии жалобы' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Уникальный идентификатор жалобы' })
  @IsString()
  complaintId: string;
}