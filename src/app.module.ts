import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './domain/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HttpResponse } from './utility/response';
import { WalletModule } from './domain/wallet/wallet.module';
import { UserModule } from './domain/user/dto/user.module';
import { PrismaDBService } from './helpers/client/prisma.db.client';
import { JwtStrategy } from './utility/auth';
import { TransactionModule } from './domain/transaction/transaction.module';
import { AuthService } from './domain/auth/auth.service';
import { AdminModule } from './domain/admin/admin.module';

export const globalProviders = [
  HttpResponse,
  JwtService,
  PrismaDBService,
  JwtStrategy,
  JwtService,
  AuthService,
];

@Global()
@Module({
  imports: [
    //Keep ConfigModule first.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    JwtModule.register({
      secret: config().jwt.secret,
      signOptions: { expiresIn: parseInt(config().jwt.expiresIn) },
    }),
    AuthModule,
    UserModule,
    WalletModule,
    TransactionModule,
    UserModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, ...globalProviders],
  exports: [...globalProviders],
})
export class AppModule {}
