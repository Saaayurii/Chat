import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class StaticFilesService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Используем относительный путь от корня проекта
    const defaultUploadDir = path.join(process.cwd(), 'uploads');
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', defaultUploadDir);
    this.baseUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:3000');
  }

  /**
   * Получить полный URL файла
   */
  getFileUrl(relativePath: string): string | null {
    if (!relativePath) {
      return null;
    }
    
    // Удаляем начальный слеш если есть
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    
    return `${this.baseUrl}/uploads/${cleanPath}`;
  }

  /**
   * Получить полный путь к файлу на сервере
   */
  getFilePath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }

  /**
   * Проверить существование файла
   */
  async fileExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFilePath(relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получить информацию о файле
   */
  async getFileInfo(relativePath: string): Promise<{
    path: string;
    url: string | null;
    size: number;
    mimeType: string;
    exists: boolean;
  }> {
    const fullPath = this.getFilePath(relativePath);
    const url = this.getFileUrl(relativePath);
    
    try {
      const stats = await fs.stat(fullPath);
      const extension = path.extname(relativePath).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      
      // Определяем MIME тип по расширению
      switch (extension) {
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.pdf':
          mimeType = 'application/pdf';
          break;
        case '.txt':
          mimeType = 'text/plain';
          break;
        case '.doc':
          mimeType = 'application/msword';
          break;
        case '.docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }

      return {
        path: relativePath,
        url,
        size: stats.size,
        mimeType,
        exists: true,
      };
    } catch {
      return {
        path: relativePath,
        url,
        size: 0,
        mimeType: 'application/octet-stream',
        exists: false,
      };
    }
  }

  /**
   * Получить буфер файла
   */
  async getFileBuffer(relativePath: string): Promise<Buffer> {
    const fullPath = this.getFilePath(relativePath);
    
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new NotFoundException(`Файл не найден: ${relativePath}`);
    }
  }

  /**
   * Создать папку uploads при запуске приложения
   */
  async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
      console.log(`📁 Папка uploads уже существует: ${this.uploadDir}`);
    } catch (accessError) {
      try {
        await fs.mkdir(this.uploadDir, { recursive: true });
        console.log(`📁 Создана папка uploads: ${this.uploadDir}`);
      } catch (mkdirError) {
        console.warn(`⚠️ Не удалось создать папку uploads: ${this.uploadDir}`, mkdirError.message);
        // Используем временную папку как fallback
        const tempUploadDir = path.join(process.cwd(), 'temp-uploads');
        try {
          await fs.mkdir(tempUploadDir, { recursive: true });
          console.log(`📁 Создана временная папка uploads: ${tempUploadDir}`);
        } catch (tempError) {
          console.error(`❌ Критическая ошибка: не удалось создать ни основную, ни временную папку uploads`, tempError);
        }
      }
    }
  }

  /**
   * Очистить старые файлы (старше N дней)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    
    try {
      const files = await this.getAllFiles(this.uploadDir);
      
      for (const filePath of files) {
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          try {
            await fs.unlink(filePath);
            deletedCount++;
          } catch (error) {
            console.warn(`Не удалось удалить файл: ${filePath}`, error);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при очистке старых файлов:', error);
    }
    
    return deletedCount;
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Папка может не существовать
    }
    
    return files;
  }
}