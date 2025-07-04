import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { TransferGateway } from './transfer.gateway';
import { Transfer, TransferSchema } from './schemas/transfer.schema';
import { Queue, QueueSchema } from './schemas/queue.schema';
import { TransferPermissionGuard } from './guards/transfer-permission.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transfer.name, schema: TransferSchema },
      { name: Queue.name, schema: QueueSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [TransferController],
  providers: [
    TransferService,
    TransferGateway,
    TransferPermissionGuard,
  ],
  exports: [TransferService, TransferGateway],
})
export class TransferModule {}