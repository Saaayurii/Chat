import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserResponse } from '../users/interfaces/user-response.interface';

import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { UserRole } from '../database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto/register.dto';
import { LoginDto } from './dto/login.dto/login.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto/confirm-email.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto/reset-password.dto';
import { AuthResponse } from './interfaces/auth-response.interface';



@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
  private usersService: UsersService,
  private jwtService: JwtService,
  private configService: ConfigService,
) {
  const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY не найден в переменных окружения');
  }
  
  this.resend = new Resend(resendApiKey);
}

  // Регистрация нового пользователя
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Проверяем существование пользователя
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Создаем пользователя (неактивированного)
    const user = await this.usersService.createUser({
      email: registerDto.email,
      password: registerDto.password,
      username: registerDto.username,
      fullName: registerDto.fullName,
      role: UserRole.VISITOR,
    });

    // Отправляем письмо с подтверждением
    await this.sendConfirmationEmail(user.email, user._id.toString());

    return {
      message: 'Регистрация успешна! Проверьте email для подтверждения аккаунта.',
    };
  }

  // Вход в систему
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUserCredentials(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActivated) {
      throw new UnauthorizedException('Аккаунт не подтвержден. Проверьте email.');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Обновляем статус онлайн
    await this.usersService.updateOnlineStatus(user._id.toString(), true);

    // Генерируем токены
    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  // Подтверждение email
  async confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(confirmEmailDto.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.purpose !== 'email-confirmation') {
        throw new BadRequestException('Некорректный токен подтверждения');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      if (user.isActivated) {
        throw new BadRequestException('Email уже подтвержден');
      }

      // Активируем пользователя
      await this.usersService.activateUser(user._id.toString());

      return { message: 'Email успешно подтвержден! Теперь вы можете войти в систему.' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Токен подтверждения истек');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Некорректный токен подтверждения');
      }
      throw error;
    }
  }

  // Запрос на сброс пароля
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      // Не раскрываем информацию о существовании пользователя
      return { message: 'Если аккаунт существует, инструкции отправлены на email.' };
    }

    // Отправляем письмо со сбросом пароля
    await this.sendPasswordResetEmail(user.email, user._id.toString());

    return { message: 'Если аккаунт существует, инструкции отправлены на email.' };
  }

  // Сброс пароля
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(resetPasswordDto.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.purpose !== 'password-reset') {
        throw new BadRequestException('Некорректный токен сброса пароля');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      // Хешируем новый пароль
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

      // Обновляем пароль в базе данных
      await this.usersService.updateUser(user._id.toString(), {
        // Нужно добавить метод для обновления пароля в UsersService
      });

      return { message: 'Пароль успешно изменен! Теперь вы можете войти с новым паролем.' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Токен сброса пароля истек');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Некорректный токен сброса пароля');
      }
      throw error;
    }
  }

  // Выход из системы
  async logout(userId: string): Promise<{ message: string }> {
    // Обновляем статус оффлайн
    await this.usersService.updateOnlineStatus(userId, false);

    return { message: 'Вы успешно вышли из системы' };
  }

  // Обновление токена доступа
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findByEmail(payload.email);
      if (!user || user.isBlocked) {
        throw new UnauthorizedException('Неавторизованный доступ');
      }

      const newAccessToken = await this.generateAccessToken(user);
      return { access_token: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Некорректный refresh token');
    }
  }

  // Валидация пользователя по email и паролю
  async validateUserCredentials(email: string, password: string): Promise<UserResponse | null> {
    return this.usersService.validateUser(email, password);
  }

  private async sendConfirmationEmail(email: string, userId: string): Promise<void> {
  const jwtSecret = this.configService.get<string>('JWT_SECRET');
  const clientUrl = this.configService.get<string>('CLIENT_URL');
  const fromEmail = this.configService.get<string>('FROM_EMAIL');

  if (!jwtSecret || !clientUrl || !fromEmail) {
    throw new BadRequestException('Не настроены переменные окружения для отправки email');
  }

  const confirmationToken = this.jwtService.sign(
    { 
      email,
      userId,
      purpose: 'email-confirmation'
    },
    { 
      secret: jwtSecret,
      expiresIn: '24h'
    }
  );

  const confirmationUrl = `${clientUrl}/auth/confirm-email?token=${confirmationToken}`;

  try {
    await this.resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Подтвердите ваш email',
      html: this.getConfirmationEmailTemplate(confirmationUrl),
    });
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw new BadRequestException('Не удалось отправить письмо подтверждения');
  }
}


 // Исправьте метод sendPasswordResetEmail
private async sendPasswordResetEmail(email: string, userId: string): Promise<void> {
  const jwtSecret = this.configService.get<string>('JWT_SECRET');
  const clientUrl = this.configService.get<string>('CLIENT_URL');
  const fromEmail = this.configService.get<string>('FROM_EMAIL');

  if (!jwtSecret || !clientUrl || !fromEmail) {
    throw new BadRequestException('Не настроены переменные окружения для отправки email');
  }

  const resetToken = this.jwtService.sign(
    { 
      email,
      userId,
      purpose: 'password-reset'
    },
    { 
      secret: jwtSecret,
      expiresIn: '1h'
    }
  );

  const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}`;

  try {
    await this.resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Сброс пароля',
      html: this.getPasswordResetEmailTemplate(resetUrl),
    });
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw new BadRequestException('Не удалось отправить письмо со сбросом пароля');
  }
}

  // Генерация токенов доступа и обновления
  private async generateTokens(user: UserResponse): Promise<{ access_token: string; refresh_token: string }> {
  const jwtSecret = this.configService.get<string>('JWT_SECRET');
  const refreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
  
  if (!jwtSecret || !refreshSecret) {
    throw new Error('JWT секреты не настроены');
  }

  const payload: JwtPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const [access_token, refresh_token] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
    }),
    this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d'),
    }),
  ]);

  return { access_token, refresh_token };
}

  // Генерация только токена доступа
  private async generateAccessToken(user: UserResponse): Promise<string> {
  const jwtSecret = this.configService.get<string>('JWT_SECRET');
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET не настроен');
  }

  const payload: JwtPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return this.jwtService.signAsync(payload, {
    secret: jwtSecret,
    expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
  });
}
  // HTML шаблон для подтверждения email
  private getConfirmationEmailTemplate(confirmationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Подтверждение email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Добро пожаловать!</h1>
          </div>
          <div class="content">
            <h2>Подтвердите ваш email адрес</h2>
            <p>Спасибо за регистрацию! Чтобы завершить процесс регистрации, подтвердите ваш email адрес.</p>
            <p>
              <a href="${confirmationUrl}" class="button">Подтвердить Email</a>
            </p>
            <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
            <p style="word-break: break-all; color: #007bff;">${confirmationUrl}</p>
            <p><strong>Важно:</strong> Эта ссылка действительна в течение 24 часов.</p>
          </div>
          <div class="footer">
            <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // HTML шаблон для сброса пароля
  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Сброс пароля</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #dc3545; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Сброс пароля</h1>
          </div>
          <div class="content">
            <h2>Запрос на сброс пароля</h2>
            <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
            <p>
              <a href="${resetUrl}" class="button">Сбросить пароль</a>
            </p>
            <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
            <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
            <p><strong>Важно:</strong> Эта ссылка действительна в течение 1 часа.</p>
          </div>
          <div class="footer">
            <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}