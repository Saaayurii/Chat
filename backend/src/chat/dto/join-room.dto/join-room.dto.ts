import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;
}
