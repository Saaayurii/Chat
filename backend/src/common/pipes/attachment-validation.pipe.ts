import { Injectable } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

@Injectable()
export class AttachmentValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      maxSize: 10 * 1024 * 1024, // 10MB для вложений
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'
      ],
      required: false,
    });
  }
}