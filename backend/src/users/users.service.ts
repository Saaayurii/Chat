import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { CreateOperatorDto } from './dto/create-operator.dto/create-operator.dto';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { DeleteUserDto } from './dto/delete-user.dto/delete-user.dto';
import { UserResponse } from './interfaces/user-response.interface';

// Интерфейс для файла без Express.Multer
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponse> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Проверяем уникальность username
    const existingUsername = await this.userModel.findOne({
      'profile.username': createUserDto.username,
    });

    if (existingUsername) {
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    // Хешируем пароль
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Создаем пользователя
    const newUser = new this.userModel({
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      role: createUserDto.role || UserRole.VISITOR,
      profile: {
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        bio: createUserDto.bio,
        lastSeenAt: new Date(),
        isOnline: false,
      },
      // Инициализируем статистику для операторов
      ...(createUserDto.role === UserRole.OPERATOR && {
        operatorStats: {
          totalQuestions: 0,
          resolvedQuestions: 0,
          averageRating: 0,
          totalRatings: 0,
          responseTimeAvg: 0,
        },
      }),
    });

    const savedUser = await newUser.save();

    // Не возвращаем пароль в ответе
    const { passwordHash: _, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword as UserResponse;
  }

  async createOperator(
    createOperatorDto: CreateOperatorDto,
  ): Promise<UserResponse> {
    // Генерируем временный пароль если не указан
    const temporaryPassword =
      createOperatorDto.temporaryPassword || this.generateTemporaryPassword();

    const operatorData: CreateUserDto = {
      email: createOperatorDto.email,
      password: temporaryPassword,
      username: createOperatorDto.username,
      fullName: createOperatorDto.fullName,
      phone: createOperatorDto.phone,
      bio: createOperatorDto.bio,
      role: UserRole.OPERATOR,
    };

    const operator = await this.createUser(operatorData);

    // TODO: Отправить email с временным паролем
    // await this.emailService.sendOperatorCredentials(operator.email, temporaryPassword);

    return operator;
  }

  async findAllUsers(params: {
    page: number;
    limit: number;
    role?: UserRole;
    search?: string;
  }) {
    const { page, limit, role, search } = params;
    const skip = (page - 1) * limit;

    // Строим фильтр
    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.username': { $regex: search, $options: 'i' } },
        { 'profile.fullName': { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOperators(onlineOnly?: boolean) {
    const filter: any = { role: UserRole.OPERATOR, isBlocked: false };

    if (onlineOnly) {
      filter['profile.isOnline'] = true;
    }

    return this.userModel
      .find(filter)
      .select('-passwordHash')
      .sort({ 'operatorStats.averageRating': -1, 'profile.username': 1 })
      .exec();
  }

  async findUserById(
    id: string,
    currentUser: UserDocument,
  ): Promise<UserResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный ID пользователя');
    }

    const user = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .exec();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем права доступа
    if (
      currentUser.role === UserRole.VISITOR &&
      currentUser._id.toString() !== id
    ) {
      throw new ForbiddenException(
        'Недостаточно прав для просмотра этого профиля',
      );
    }

    return user.toObject() as UserResponse;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный ID пользователя');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем уникальность email если он изменяется
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email.toLowerCase(),
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          ...updateUserDto,
          ...(updateUserDto.email && {
            email: updateUserDto.email.toLowerCase(),
          }),
        },
        { new: true, runValidators: true },
      )
      .select('-passwordHash')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    return updatedUser.toObject() as UserResponse;
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash')
      .exec();

    if (!user) {
      throw new NotFoundException('Профиль не найден');
    }

    return user.toObject() as UserResponse;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponse> {
    // Проверяем уникальность username если он изменяется
    if (updateProfileDto.username) {
      const existingUser = await this.userModel.findOne({
        'profile.username': updateProfileDto.username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким именем уже существует',
        );
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            'profile.username': updateProfileDto.username,
            'profile.fullName': updateProfileDto.fullName,
            'profile.phone': updateProfileDto.phone,
            'profile.avatarUrl': updateProfileDto.avatarUrl,
            'profile.bio': updateProfileDto.bio,
          },
        },
        { new: true, runValidators: true },
      )
      .select('-passwordHash')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    return updatedUser.toObject() as UserResponse;
  }

  async uploadAvatar(
    userId: string,
    file: UploadedFile,
  ): Promise<{ avatarUrl: string }> {
    // TODO: Реализовать загрузку файла в хранилище (AWS S3, Cloudinary и т.д.)
    const avatarUrl = `/uploads/avatars/${userId}-${Date.now()}-${file.originalname}`;

    await this.userModel.findByIdAndUpdate(userId, {
      $set: { 'profile.avatarUrl': avatarUrl },
    });

    return { avatarUrl };
  }

  async toggleUserBlock(
    userId: string,
    adminId: string,
  ): Promise<{ isBlocked: boolean }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const newBlockStatus = !user.isBlocked;

    await this.userModel.findByIdAndUpdate(userId, {
      isBlocked: newBlockStatus,
      blacklistedByAdmin: newBlockStatus,
    });

    return { isBlocked: newBlockStatus };
  }

  async activateUser(userId: string): Promise<{ isActivated: boolean }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.userModel.findByIdAndUpdate(userId, { isActivated: true });

    return { isActivated: true };
  }

  async deleteUser(
    userId: string,
    deleteUserDto: DeleteUserDto,
    adminId: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Мягкое удаление - помечаем как заблокированного
    await this.userModel.findByIdAndUpdate(userId, {
      isBlocked: true,
      blacklistedByAdmin: true,
      // Сохраняем информацию об удалении в дополнительных полях
      $set: {
        'deletionInfo.deletedAt': new Date(),
        'deletionInfo.deletedBy': adminId,
        'deletionInfo.reason': deleteUserDto.reason,
        'deletionInfo.additionalInfo': deleteUserDto.additionalInfo,
      },
    });

    return { message: 'Пользователь успешно удален' };
  }

  async updateOnlineStatus(
    userId: string,
    isOnline: boolean,
  ): Promise<{ isOnline: boolean }> {
    await this.userModel.findByIdAndUpdate(userId, {
      'profile.isOnline': isOnline,
      'profile.lastSeenAt': new Date(),
    });

    return { isOnline };
  }

  async getOnlineStatus(
    userId: string,
  ): Promise<{ isOnline: boolean; lastSeenAt: Date }> {
    const user = await this.userModel
      .findById(userId)
      .select('profile.isOnline profile.lastSeenAt')
      .exec();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      isOnline: user.profile.isOnline,
      lastSeenAt: user.profile.lastSeenAt,
    };
  }

  async getProfileStatistics(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === UserRole.OPERATOR) {
      return {
        role: user.role,
        operatorStats: user.operatorStats,
        profileCompleteness: this.calculateProfileCompleteness(user),
        accountAge: this.calculateAccountAge(user.createdAt),
      };
    }

    return {
      role: user.role,
      profileCompleteness: this.calculateProfileCompleteness(user),
      accountAge: this.calculateAccountAge(user.createdAt),
    };
  }

  async getUsersStats() {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      adminCount,
      operatorCount,
      visitorCount,
      onlineUsers,
      usersToday,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isBlocked: false }),
      this.userModel.countDocuments({ isBlocked: true }),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ role: UserRole.OPERATOR }),
      this.userModel.countDocuments({ role: UserRole.VISITOR }),
      this.userModel.countDocuments({ 'profile.isOnline': true }),
      this.userModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
      online: onlineUsers,
      registeredToday: usersToday,
      byRole: {
        admin: adminCount,
        operator: operatorCount,
        visitor: visitorCount,
      },
    };
  }

  // Вспомогательные методы
  private generateTemporaryPassword(): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  private calculateProfileCompleteness(user: UserDocument): number {
    let completeness = 0;
    const fields = [
      user.email,
      user.profile?.username,
      user.profile?.fullName,
      user.profile?.phone,
      user.profile?.bio,
      user.profile?.avatarUrl,
    ];

    const filledFields = fields.filter(
      (field) => field && field.trim().length > 0,
    );
    completeness = Math.round((filledFields.length / fields.length) * 100);

    return completeness;
  }

  private calculateAccountAge(createdAt: Date): {
    days: number;
    months: number;
  } {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    return { days: diffDays, months: diffMonths };
  }

  // Методы для внутреннего использования другими сервисами
  async updateOperatorStats(
    operatorId: string,
    stats: Partial<{
      totalQuestions: number;
      resolvedQuestions: number;
      averageRating: number;
      totalRatings: number;
      responseTimeAvg: number;
    }>,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(operatorId, {
      $set: { operatorStats: stats },
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponse | null> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      isBlocked: false,
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash: _, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword as UserResponse;
    }

    return null;
  }
  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
    });
  }
}
