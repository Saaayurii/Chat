import { 
  ArgumentMetadata, 
  Injectable, 
  PipeTransform, 
  BadRequestException 
} from '@nestjs/common';
import { UploadedFile } from '../interfaces/uploaded-file.interface';

export interface FileValidationOptions {
  maxSize?: number; // в байтах
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly defaultOptions: FileValidationOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB по умолчанию
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'],
    required: false,
  };

  constructor(private options: FileValidationOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  transform(file: UploadedFile | UploadedFile[], metadata: ArgumentMetadata) {
    // Если файл не обязателен и не предоставлен
    if (!file && !this.options.required) {
      return file;
    }

    // Если файл обязателен, но не предоставлен
    if (!file && this.options.required) {
      throw new BadRequestException('Файл обязателен для загрузки');
    }

    // Валидация одного файла
    if (!Array.isArray(file)) {
      return this.validateSingleFile(file);
    }

    // Валидация массива файлов
    return file.map(f => this.validateSingleFile(f));
  }

  private validateSingleFile(file: UploadedFile): UploadedFile {
    if (!file) {
      throw new BadRequestException('Файл не найден');
    }

    // Проверка размера файла
    if (this.options.maxSize && file.size > this.options.maxSize) {
      const maxSizeMB = (this.options.maxSize / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `Размер файла превышает максимально допустимый (${maxSizeMB}MB)`
      );
    }

    // Проверка MIME типа
    if (this.options.allowedMimeTypes && !this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Недопустимый тип файла. Разрешены: ${this.options.allowedMimeTypes.join(', ')}`
      );
    }

    // Проверка расширения файла
    if (this.options.allowedExtensions) {
      const fileExtension = this.getFileExtension(file.originalname);
      if (!this.options.allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          `Недопустимое расширение файла. Разрешены: ${this.options.allowedExtensions.join(', ')}`
        );
      }
    }

    // Проверка на потенциально опасные файлы
    this.checkForMaliciousFile(file);

    // Санитизация имени файла
    file.originalname = this.sanitizeFileName(file.originalname);

    return file;
  }

  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.'));
  }

  private checkForMaliciousFile(file: UploadedFile): void {
    // Список потенциально опасных расширений
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.rpm', '.sh', '.run', '.bin'
    ];

    const fileExtension = this.getFileExtension(file.originalname).toLowerCase();
    
    if (dangerousExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Загрузка исполняемых файлов запрещена из соображений безопасности'
      );
    }

    // Проверка двойных расширений (например, .txt.exe)
    const nameParts = file.originalname.split('.');
    if (nameParts.length > 2) {
      const potentialHiddenExt = '.' + nameParts[nameParts.length - 2].toLowerCase();
      if (dangerousExtensions.includes(potentialHiddenExt)) {
        throw new BadRequestException(
          'Файлы с двойными расширениями запрещены из соображений безопасности'
        );
      }
    }

    // Проверка на null bytes
    if (file.originalname.includes('\0')) {
      throw new BadRequestException('Недопустимые символы в имени файла');
    }

    // Проверка на PHP в начале изображений (PHP injection)
    if (file.mimetype.startsWith('image/') && file.buffer) {
      const fileStart = file.buffer.slice(0, 10).toString();
      if (fileStart.includes('<?php') || fileStart.includes('<?=')) {
        throw new BadRequestException('Обнаружен потенциально вредоносный код в файле');
      }
    }
  }

  private sanitizeFileName(filename: string): string {
    // Удаляем или заменяем опасные символы
    return filename
      .replace(/[^a-zA-Z0-9.-_]/g, '_') // заменяем опасные символы на подчеркивания
      .replace(/\.+/g, '.') // убираем множественные точки
      .replace(/^\./, '') // убираем точку в начале
      .replace(/\.$/, '') // убираем точку в конце
      .substring(0, 255); // ограничиваем длину
  }
}
