import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaDBService extends PrismaClient implements OnModuleInit {
  logger = new Logger(PrismaDBService.name);
  async onModuleInit() {
    this.logger.log('Prisma client connected successfully');
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
