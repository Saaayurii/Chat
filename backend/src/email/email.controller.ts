import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendTemplateEmailDto } from './dto/email-template.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/schemas/user.schema';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Отправить email',
    description: 'Отправляет произвольное email сообщение с возможностью добавления вложений'
  })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Email успешно отправлен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    const result = await this.emailService.sendEmail(sendEmailDto);
    return { success: result };
  }

  @Post('send-template')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Отправить шаблонное email',
    description: 'Отправляет email на основе предустановленного шаблона с подстановкой переменных'
  })
  @ApiBody({ type: SendTemplateEmailDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Шаблонное email успешно отправлено',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные или неизвестный шаблон' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendTemplateEmail(@Body() templateEmailDto: SendTemplateEmailDto) {
    const result = await this.emailService.sendTemplateEmail(templateEmailDto);
    return { success: result };
  }

  @Post('welcome')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Отправить приветственное email',
    description: 'Отправляет приветственное письмо новому пользователю'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        username: { type: 'string', example: 'john_doe' }
      },
      required: ['email', 'username']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Приветственное email успешно отправлено',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректный email или имя пользователя' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendWelcomeEmail(@Body() { email, username }: { email: string; username: string }) {
    const result = await this.emailService.sendWelcomeEmail(email, username);
    return { success: result };
  }

  @Post('password-reset')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Отправить email для сброса пароля',
    description: 'Отправляет пользователю ссылку для сброса пароля'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        resetUrl: { type: 'string', format: 'uri', example: 'https://example.com/reset-password?token=abc123' }
      },
      required: ['email', 'resetUrl']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email для сброса пароля успешно отправлен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректный email или URL' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendPasswordResetEmail(@Body() { email, resetUrl }: { email: string; resetUrl: string }) {
    const result = await this.emailService.sendPasswordResetEmail(email, resetUrl);
    return { success: result };
  }

  @Post('email-verification')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Отправить email для подтверждения',
    description: 'Отправляет пользователю ссылку для подтверждения email адреса'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        verificationUrl: { type: 'string', format: 'uri', example: 'https://example.com/verify-email?token=abc123' }
      },
      required: ['email', 'verificationUrl']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email для подтверждения успешно отправлен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректный email или URL' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendEmailVerification(@Body() { email, verificationUrl }: { email: string; verificationUrl: string }) {
    const result = await this.emailService.sendEmailVerification(email, verificationUrl);
    return { success: result };
  }

  @Post('operator-assigned')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Уведомить о назначении оператора',
    description: 'Отправляет уведомление посетителю о том, что его вопросу назначен оператор'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        operatorName: { type: 'string', example: 'Иван Петров' },
        questionText: { type: 'string', example: 'Как изменить пароль?' }
      },
      required: ['email', 'operatorName', 'questionText']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Уведомление о назначении оператора отправлено',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendOperatorAssignedEmail(
    @Body() { email, operatorName, questionText }: { email: string; operatorName: string; questionText: string }
  ) {
    const result = await this.emailService.sendOperatorAssignedEmail(email, operatorName, questionText);
    return { success: result };
  }

  @Post('question-answered')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Уведомить об ответе на вопрос',
    description: 'Отправляет уведомление посетителю о получении ответа на его вопрос'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        questionText: { type: 'string', example: 'Как изменить пароль?' },
        answer: { type: 'string', example: 'Для изменения пароля перейдите в настройки профиля...' }
      },
      required: ['email', 'questionText', 'answer']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Уведомление об ответе отправлено',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendQuestionAnsweredEmail(
    @Body() { email, questionText, answer }: { email: string; questionText: string; answer: string }
  ) {
    const result = await this.emailService.sendQuestionAnsweredEmail(email, questionText, answer);
    return { success: result };
  }

  @Post('complaint-received')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Уведомить о принятии жалобы',
    description: 'Отправляет подтверждение о том, что жалоба принята к рассмотрению'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        complaintId: { type: 'string', example: '507f1f77bcf86cd799439011' }
      },
      required: ['email', 'complaintId']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Уведомление о принятии жалобы отправлено',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendComplaintReceivedEmail(
    @Body() { email, complaintId }: { email: string; complaintId: string }
  ) {
    const result = await this.emailService.sendComplaintReceivedEmail(email, complaintId);
    return { success: result };
  }

  @Post('blacklist-notification')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Уведомить о блокировке',
    description: 'Отправляет уведомление пользователю о добавлении в черный список'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        reason: { type: 'string', example: 'Нарушение правил поведения' },
        duration: { type: 'string', example: '7 дней' }
      },
      required: ['email', 'reason']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Уведомление о блокировке отправлено',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendBlacklistNotificationEmail(
    @Body() { email, reason, duration }: { email: string; reason: string; duration?: string }
  ) {
    const result = await this.emailService.sendBlacklistNotificationEmail(email, reason, duration);
    return { success: result };
  }

  @Post('rating-request')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Запросить оценку работы оператора',
    description: 'Отправляет просьбу оценить качество работы оператора'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        operatorName: { type: 'string', example: 'Иван Петров' },
        ratingUrl: { type: 'string', format: 'uri', example: 'https://example.com/rate-operator?id=123' }
      },
      required: ['email', 'operatorName', 'ratingUrl']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Запрос оценки отправлен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async sendRatingRequestEmail(
    @Body() { email, operatorName, ratingUrl }: { email: string; operatorName: string; ratingUrl: string }
  ) {
    const result = await this.emailService.sendRatingRequestEmail(email, operatorName, ratingUrl);
    return { success: result };
  }
}