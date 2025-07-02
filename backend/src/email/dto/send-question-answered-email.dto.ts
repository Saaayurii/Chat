import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendQuestionAnsweredEmailDto {
  @ApiProperty({ description: 'Email пользователя для уведомления об ответе на вопрос' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Текст исходного вопроса пользователя' })
  @IsString()
  questionText: string;

  @ApiProperty({ description: 'Ответ оператора на вопрос' })
  @IsString()
  answer: string;
}