import { IsOptional, IsInt, Min, Max, IsMongoId, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetMessagesDto {
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Лимит должен быть целым числом' })
  @Min(1, { message: 'Лимит должен быть больше 0' })
  @Max(100, { message: 'Лимит не может превышать 100' })
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Смещение должно быть целым числом' })
  @Min(0, { message: 'Смещение не может быть отрицательным' })
  skip?: number = 0;
}