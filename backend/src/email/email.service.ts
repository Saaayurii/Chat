import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendEmailDto } from './dto/send-email.dto';
import { SendTemplateEmailDto, EmailTemplate } from './dto/email-template.dto';
import { EmailData } from './interfaces/email-data.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.initializeResend();
  }

  private initializeResend() {
    const apiKey = this.configService.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<boolean> {
    try {
      const emailData: EmailData = {
        from: sendEmailDto.from || this.configService.get('FROM_EMAIL') || 'noreply@yourdomain.com',
        to: [sendEmailDto.to],
        subject: sendEmailDto.subject,
        text: sendEmailDto.text || 'Email content',
      };

      if (sendEmailDto.html) {
        emailData.html = sendEmailDto.html;
      }

      if (sendEmailDto.attachments && sendEmailDto.attachments.length > 0) {
        emailData.attachments = sendEmailDto.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        this.logger.error(`Failed to send email to ${sendEmailDto.to}:`, error);
        return false;
      }

      this.logger.log(`Email sent successfully to ${sendEmailDto.to}: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendEmailDto.to}:`, error);
      return false;
    }
  }

  async sendTemplateEmail(templateEmailDto: SendTemplateEmailDto): Promise<boolean> {
    try {
      const { subject, html, text } = await this.getEmailTemplate(
        templateEmailDto.template,
        templateEmailDto.variables || {},
        templateEmailDto.language || 'ru'
      );

      return this.sendEmail({
        to: templateEmailDto.to,
        subject,
        html,
        text,
      });
    } catch (error) {
      this.logger.error(`Failed to send template email:`, error);
      return false;
    }
  }

  private async getEmailTemplate(
    template: EmailTemplate,
    variables: Record<string, any>,
    language: string
  ): Promise<{ subject: string; html: string; text: string }> {
    const templates = {
      [EmailTemplate.WELCOME]: {
        subject: 'Добро пожаловать в Chat System!',
        html: `
          <h2>Добро пожаловать, ${variables.username || 'Пользователь'}!</h2>
          <p>Ваш аккаунт успешно создан. Теперь вы можете пользоваться нашей системой чата.</p>
          <p>Если у вас есть вопросы, обратитесь к нашим операторам.</p>
        `,
        text: `Добро пожаловать, ${variables.username || 'Пользователь'}! Ваш аккаунт успешно создан.`
      },
      [EmailTemplate.PASSWORD_RESET]: {
        subject: 'Сброс пароля - Chat System',
        html: `
          <h2>Сброс пароля</h2>
          <p>Для сброса пароля перейдите по ссылке:</p>
          <a href="${variables.resetUrl}">Сбросить пароль</a>
          <p>Ссылка действительна в течение 1 часа.</p>
        `,
        text: `Для сброса пароля перейдите по ссылке: ${variables.resetUrl}`
      },
      [EmailTemplate.EMAIL_VERIFICATION]: {
        subject: 'Подтверждение email - Chat System',
        html: `
          <h2>Подтверждение email</h2>
          <p>Для подтверждения email перейдите по ссылке:</p>
          <a href="${variables.verificationUrl}">Подтвердить email</a>
        `,
        text: `Для подтверждения email перейдите по ссылке: ${variables.verificationUrl}`
      },
      [EmailTemplate.OPERATOR_ASSIGNED]: {
        subject: 'Оператор назначен на ваш вопрос',
        html: `
          <h2>Ваш вопрос принят в работу</h2>
          <p>Оператор ${variables.operatorName} назначен на ваш вопрос.</p>
          <p>Вопрос: "${variables.questionText}"</p>
        `,
        text: `Оператор ${variables.operatorName} назначен на ваш вопрос: "${variables.questionText}"`
      },
      [EmailTemplate.QUESTION_ANSWERED]: {
        subject: 'Ответ на ваш вопрос получен',
        html: `
          <h2>Получен ответ на ваш вопрос</h2>
          <p>Ваш вопрос: "${variables.questionText}"</p>
          <p>Ответ: "${variables.answer}"</p>
        `,
        text: `Ответ на ваш вопрос "${variables.questionText}": ${variables.answer}`
      },
      [EmailTemplate.COMPLAINT_RECEIVED]: {
        subject: 'Ваша жалоба принята к рассмотрению',
        html: `
          <h2>Жалоба принята</h2>
          <p>Ваша жалоба №${variables.complaintId} принята к рассмотрению.</p>
          <p>Мы свяжемся с вами в ближайшее время.</p>
        `,
        text: `Ваша жалоба №${variables.complaintId} принята к рассмотрению.`
      },
      [EmailTemplate.BLACKLIST_NOTIFICATION]: {
        subject: 'Уведомление о блокировке',
        html: `
          <h2>Уведомление о блокировке</h2>
          <p>Ваш аккаунт заблокирован по причине: ${variables.reason}</p>
          <p>Срок блокировки: ${variables.duration || 'постоянно'}</p>
        `,
        text: `Ваш аккаунт заблокирован по причине: ${variables.reason}`
      },
      [EmailTemplate.RATING_REQUEST]: {
        subject: 'Оцените работу оператора',
        html: `
          <h2>Оцените качество обслуживания</h2>
          <p>Пожалуйста, оцените работу оператора ${variables.operatorName}.</p>
          <a href="${variables.ratingUrl}">Оставить отзыв</a>
        `,
        text: `Оцените работу оператора ${variables.operatorName}: ${variables.ratingUrl}`
      },
    };

    return templates[template] || templates[EmailTemplate.WELCOME];
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.WELCOME,
      variables: { username },
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.PASSWORD_RESET,
      variables: { resetUrl },
    });
  }

  async sendEmailVerification(email: string, verificationUrl: string): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.EMAIL_VERIFICATION,
      variables: { verificationUrl },
    });
  }

  async sendOperatorAssignedEmail(
    email: string,
    operatorName: string,
    questionText: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.OPERATOR_ASSIGNED,
      variables: { operatorName, questionText },
    });
  }

  async sendQuestionAnsweredEmail(
    email: string,
    questionText: string,
    answer: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.QUESTION_ANSWERED,
      variables: { questionText, answer },
    });
  }

  async sendComplaintReceivedEmail(email: string, complaintId: string): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.COMPLAINT_RECEIVED,
      variables: { complaintId },
    });
  }

  async sendBlacklistNotificationEmail(
    email: string,
    reason: string,
    duration?: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.BLACKLIST_NOTIFICATION,
      variables: { reason, duration },
    });
  }

  async sendRatingRequestEmail(
    email: string,
    operatorName: string,
    ratingUrl: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.RATING_REQUEST,
      variables: { operatorName, ratingUrl },
    });
  }
}
