import {
  Body,
  Headers,
  Controller,
  Post,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhookDto } from '../payment/paystack/dto/paystack.dto';
import { HttpResponse } from '../../utility/response';
import { PaystackService } from '../payment/paystack/paystack.payment';

@Controller('transactions')
export class TransactionController {
  constructor(
    // private transactionService: TransactionService,
    private paystackService: PaystackService,
    private response: HttpResponse,
  ) {}

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(
    @Body() dto: WebhookDto<any>,
    @Headers() headers: Record<string, any>,
  ) {
    const checked = await this.paystackService.paystackWebhook(dto, headers);
    if (checked) return 'webhook checked!';
    throw new UnauthorizedException();
  }
}
