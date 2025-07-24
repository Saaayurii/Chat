import { 
  Controller, 
  Post, 
  Body, 
  ValidationPipe,
  UsePipes,
  Get,
  Param,
  Query,
  Put,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateAnonymousConversationDto } from './dto/create-anonymous-conversation.dto';
import { SendAnonymousMessageDto } from './dto/send-anonymous-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@ApiTags('Public Chat')
@Controller('public/chat')
export class PublicChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Создать анонимную беседу с оператором' })
  @ApiResponse({ status: 201, description: 'Беседа успешно создана' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createAnonymousConversation(
    @Body() createConversationDto: CreateAnonymousConversationDto,
  ) {
    return this.chatService.createAnonymousConversation(createConversationDto);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Отправить сообщение в беседу от анонимного пользователя' })
  @ApiResponse({ status: 201, description: 'Сообщение успешно отправлено' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async sendAnonymousMessage(
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
    @Body() sendMessageDto: SendAnonymousMessageDto,
  ) {
    const message = await this.chatService.createAnonymousMessage({
      conversationId,
      ...sendMessageDto,
    });
    
    return {
      success: true,
      data: message,
      message: 'Сообщение успешно отправлено'
    };
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Получить сообщения беседы для анонимного пользователя' })
  @ApiResponse({ status: 200, description: 'Список сообщений' })
  async getMessages(
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
    @Query() query: GetMessagesDto,
  ) {
    const page = Math.floor((query.skip || 0) / (query.limit || 50)) + 1;
    return this.chatService.getConversationMessages(
      conversationId,
      query.limit,
      page,
    );
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Получить информацию о беседе для анонимного пользователя' })
  @ApiResponse({ status: 200, description: 'Информация о беседе' })
  async getConversation(
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
  ) {
    return this.chatService.getPublicConversation(conversationId);
  }

  @Put('conversations/:conversationId/read')
  @ApiOperation({ summary: 'Отметить сообщения как прочитанные анонимным пользователем' })
  @ApiResponse({ status: 200, description: 'Сообщения отмечены как прочитанные' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async markMessagesAsReadBySession(
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
    @Body() body: { sessionId: string },
  ) {
    // Для анонимных пользователей используем sessionId для идентификации
    return this.chatService.markAnonymousMessagesAsRead(conversationId, body.sessionId);
  }
}