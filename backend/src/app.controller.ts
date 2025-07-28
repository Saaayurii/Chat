import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StaticFilesService } from './common/services/static-files.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Static Files')
@Controller()
export class AppController {
  constructor(private readonly staticFilesService: StaticFilesService) {}

  @Get('uploads/*')
  @ApiOperation({ summary: '>;CG8BL 703@C65==K9 D09;' })
  @ApiParam({ name: 'path', description: 'CBL : D09;C', example: 'avatars/avatar.jpg' })
  async getUploadedFile(@Param('0') filePath: string, @Res() res: Response) {
    try {
      const fileInfo = await this.staticFilesService.getFileInfo(filePath);
      
      if (!fileInfo.exists) {
        throw new NotFoundException('$09; =5 =0945=');
      }

      const buffer = await this.staticFilesService.getFileBuffer(filePath);
      
      res.set({
        'Content-Type': fileInfo.mimeType,
        'Content-Length': fileInfo.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // 5H =0 1 3>4
      });

      res.send(buffer);
    } catch (error) {
      throw new NotFoundException('$09; =5 =0945=');
    }
  }
}