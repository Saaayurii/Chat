import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { StaticFilesService } from './common/services/static-files.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private readonly staticFilesService: StaticFilesService) {}

  async onApplicationBootstrap() {
    // !>7405< ?0?:C uploads ?@8 70?CA:5 ?@8;>65=8O
    await this.staticFilesService.ensureUploadsDirectory();
  }

  getHello(): string {
    return 'Chat API is running!';
  }
}