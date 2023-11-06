import axios from 'axios';
import {
  TransactionPayload,
  TransactionResponse,
  WebhookDto,
} from './dto/paystack.dto';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import config from 'src/config';
import { PrismaDBService } from '../../../helpers/client/prisma.db.client';

const Config = config();

@Injectable()
export class PaystackService {
  constructor(private prismaService: PrismaDBService) {}

  base_url = Config.paystack.base_url;
  secret_key = Config.paystack.secret_key;

  async initializeTransaction(payload: TransactionPayload) {
    const url: string = `${this.base_url}/transaction/initialize/`;
    const amount = (payload.amount * 100).toString(); // convert to kobo

    const { data, status } = await axios.post<TransactionResponse>(
      url,
      {
        email: payload.email,
        amount: amount,
        reference: payload.reference,
        metadata: payload.metadata,
        callback_url: payload.callback_url,
        currency: payload.currency,
        channels: payload.channels || ['card', 'bank'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: ` Bearer ${this.secret_key}`,
        },
      },
    );
    if (status === 200) return data;
    return null;
  }

  async generatePaystackPaymentLink(
    payload: {
      reference: string;
      amount: number;
      currency: string;
      email: string;
      metadata: Record<string, any>;
      callback_url?: string;
    },
    channels?: string[],
  ) {
    const paystackPayload: TransactionPayload = {
      reference: payload.reference,
      amount: payload.amount,
      email: payload.email,
      metadata: payload.metadata,
      currency: payload.currency,
      callback_url: payload.callback_url || '',
      channels: undefined,
    };

    paystackPayload.channels = channels;
    return await this.initializeTransaction(paystackPayload);
  }

  // Paystack Webhooks
  async paystackWebhook(dto: WebhookDto<any>, headers) {
    const hash = crypto
      .createHmac('sha512', Config.paystack.secret_key)
      .update(JSON.stringify(dto))
      .digest('hex');

    if (hash !== headers['x-paystack-signature']) return false;

    if (dto.event === 'charge.success') {
      switch (dto.data.metadata.action) {
        case 'CreditWallet':
          const payload = {
            user_id: dto.data.metadata.user_id,
            reference: dto.data.metadata.reference,
            amount: dto.data.metadata.amount / 100,
          };

          await this.handleWalletFund(payload);
          break;
      }
    }

    return true;
  }

  private async handleWalletFund(dto: {
    user_id: string;
    reference: string;
    amount: number;
  }) {
    console.log('===dto22==', dto);

    const transaction = await this.prismaService.transaction.findFirst({
      where: { reference: dto.reference, status: 'PENDING' }, // check status of pending to prevent multiple credit
    });

    if (!transaction) {
      console.log(
        'Transaction with reference ${dto.reference} not found or Wallet has been credited for this transaction',
      );

      return true;
    }

    const wallet = await this.prismaService.wallet.findFirst({
      where: { id: transaction.wallet_id },
    });

    console.log('===wallet===', wallet);

    await this.prismaService.wallet.update({
      where: { id: transaction.wallet_id },
      data: {
        balance: { increment: dto.amount },
        // balance: wallet.balance + dto.amount,
      },
    });

    await this.prismaService.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });
    return {
      message: 'Wallet funded successfully',
    };
  }
}
