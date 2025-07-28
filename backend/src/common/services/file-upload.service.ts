import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly allowedImageTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', '/opt/render/project/src/uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    this.allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    // Валидация файла
    this.validateFile(file);

    // Создаем папку если не существует
    const uploadPath = path.join(this.uploadDir, folder);
    await this.ensureDirectoryExists(uploadPath);

    // Генерируем уникальное имя файла
    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(uploadPath, fileName);

    // Сохраняем файл
    await fs.writeFile(filePath, file.buffer);

    // Возвращаем относительный путь
    return path.join(folder, fileName);
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'images', options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): Promise<string> {
    // Валидация изображения
    this.validateImage(file);

    // Создаем папку если не существует
    const uploadPath = path.join(this.uploadDir, folder);
    await this.ensureDirectoryExists(uploadPath);

    // Генерируем уникальное имя файла
    const fileName = this.generateFileName(file.originalname, 'jpg');
    const filePath = path.join(uploadPath, fileName);

    // Обрабатываем изображение с помощью Sharp
    let sharpInstance = sharp(file.buffer);

    if (options?.width || options?.height) {
      sharpInstance = sharpInstance.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Конвертируем в JPEG с заданным качеством
    await sharpInstance
      .jpeg({ quality: options?.quality || 85 })
      .toFile(filePath);

    // Возвращаем относительный путь
    return path.join(folder, fileName);
  }

  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    return this.uploadImage(file, 'avatars', {
      width: 300,
      height: 300,
      quality: 85,
    });
  }

  async uploadChatAttachment(file: Express.Multer.File, conversationId: string): Promise<{
    path: string;
    originalName: string;
    size: number;
    mimeType: string;
  }> {
    const folder = `chat-attachments/${conversationId}`;
    
    let filePath: string;
    
    if (this.allowedImageTypes.includes(file.mimetype)) {
      // Обрабатываем изображения
      filePath = await this.uploadImage(file, folder, {
        width: 1920,
        height: 1080,
        quality: 85,
      });
    } else {
      // Обычные файлы
      filePath = await this.uploadFile(file, folder);
    }

    return {
      path: filePath,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      // Файл уже удален или не существует
      console.warn(`Failed to delete file: ${filePath}`, error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`Размер файла не должен превышать ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Неподдерживаемый тип файла');
    }
  }

  private validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Изображение не предоставлено');
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Неподдерживаемый тип изображения');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`Размер изображения не должен превышать ${this.maxFileSize / 1024 / 1024}MB`);
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private generateFileName(originalName: string, forceExtension?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    
    if (forceExtension) {
      return `${timestamp}_${randomString}.${forceExtension}`;
    }
    
    const extension = path.extname(originalName).toLowerCase();
    const nameWithoutExt = path.basename(originalName, extension);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${timestamp}_${randomString}_${safeName}${extension}`;
  }
}