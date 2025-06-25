import { Body, Controller, Post, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegistrationDto } from '../dtos/registration.dto';
import { LoginDto } from '../dtos/login.dto';
import { Request, Response } from 'express';
import { User } from '../model/user.model';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegistrationDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const tokens = await this.authService.generateTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
    return res.json({ accessToken: tokens.accessToken });
  }


  @ApiBearerAuth()
  @Post('refresh')
  @UseGuards(AuthGuard('refresh'))
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    if (!user)
      return res.status(401).json({ message: 'Не верный refresh токен.' });

    try {
      const tokens = await this.authService.generateTokens(user as User);
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
      });
      return res.json({ accessToken: tokens.accessToken });
    } catch {
      return res.status(500).json({ message: 'Ошибка на сервере.' });
    }
  }
}
