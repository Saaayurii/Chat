import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../model/user.model';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Пользователь уже существует.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      passwordHash: hashedPassword,
      role: 'user',
    });
    return user.save();
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  }

  async validateUserById(id: string) {
    return await this.userModel.findById(id).exec();
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user._id, email: user.email },
        { secret: 'secretKey', expiresIn: '1d' },
      ),
      this.jwtService.signAsync(
        { sub: user._id },
        { secret: 'refreshSecret', expiresIn: '7d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
