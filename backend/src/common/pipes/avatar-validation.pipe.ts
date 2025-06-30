import { Injectable } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

@Injectable()
export class AvatarValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      required: true,
    });
  }
}