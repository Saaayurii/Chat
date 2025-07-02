import { IsNotEmpty, IsMongoId } from 'class-validator';

export class MarkMessagesReadDto {
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;
}