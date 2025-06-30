import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ValidationPipe,
  UsePipes,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto/create-conversation.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MarkMessagesReadDto } from './dto/mark-read.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AttachmentValidationPipe } from '../common/pipes/attachment-validation.pipe';
import { UploadedFile as FileInterface } from '../common/interfaces/uploaded-file.interface';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Создать новую беседу' })
  @ApiResponse({ status: 201, description: 'Беседа успешно создана' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Request() req: any,
  ) {
    // Добавляем создателя беседы к участникам
    const participantIds = [...new Set([req.user.id, ...createConversationDto.participantIds])];
    
    return this.chatService.createConversation({
      ...createConversationDto,
      participantIds,
      createdBy: req.user.id,
    });
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Получить сообщения беседы' })
  @ApiResponse({ status: 200, description: 'Список сообщений' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesDto,
    @Request() req: any,
  ) {
    return this.chatService.getConversationMessages(
      conversationId,
      req.user.id,
      query.limit,
      query.skip,
    );
  }

  @Put('conversations/:conversationId/read')
  @ApiOperation({ summary: 'Пометить сообщения как прочитанные' })
  @ApiResponse({ status: 200, description: 'Сообщения помечены как прочитанные' })
  async markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    await this.chatService.markMessagesAsRead(conversationId, req.user.id);
    return { message: 'Сообщения помечены как прочитанные' };
  }

  @Post('conversations/:conversationId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Загрузить вложение в беседу' })
  @ApiResponse({ status: 201, description: 'Вложение загружено' })
  async uploadAttachment(
    @Param('conversationId') conversationId: string,
    @Body() uploadDto: UploadAttachmentDto,
    @UploadedFile(AttachmentValidationPipe) file: FileInterface,
    @Request() req: any,
  ) {
    return this.chatService.uploadAttachment(conversationId, req.user.id, file, uploadDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Получить список бесед пользователя' })
  @ApiResponse({ status: 200, description: 'Список бесед' })
  async getUserConversations(@Request() req: any) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Получить информацию о беседе' })
  @ApiResponse({ status: 200, description: 'Информация о беседе' })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    return this.chatService.getConversation(conversationId, req.user.id);
  }
}
