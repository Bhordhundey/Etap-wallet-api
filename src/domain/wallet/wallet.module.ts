import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserService } from '../user/user.service';
import { PaystackService } from '../payment/paystack/paystack.payment';

@Module({
  imports: [],
  controllers: [WalletController],
  providers: [WalletService, UserService, PaystackService],
})
export class WalletModule {}
