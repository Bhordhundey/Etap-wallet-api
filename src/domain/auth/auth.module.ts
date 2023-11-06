import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaDBService } from 'src/helpers/client/prisma.db.client';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaDBService],
})
export class AuthModule {}
