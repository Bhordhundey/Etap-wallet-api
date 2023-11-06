import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
// import { TransactionService } from './transaction.service';
import { PaystackService } from '../payment/paystack/paystack.payment';

@Module({
  controllers: [TransactionController],
  providers: [PaystackService],
})
export class TransactionModule {}
