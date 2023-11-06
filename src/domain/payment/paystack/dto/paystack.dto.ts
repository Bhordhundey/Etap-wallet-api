import { IsNotEmpty, IsString } from "class-validator";

export type TransactionPayload = {
  reference?: string;
  amount: number;
  email: string;
  metadata?: any;
  currency?: string;
  callback_url?: string;
  channels?: string[];
  authorization_code?: string;
};

export type InitTransaferDto = {
  source: string;
  amount: number;
  recipient: string;
  reference: string;
};

export type TransactionResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference?: string;
  };
};

export type PaystackCreatePlanDto = {
  name: string;
  interval: string;
  amount: number;
  send_invoices: boolean;
  currency: string;
};

export type PaystackCreateSubDto = {
  reference: string;
  amount: number;
  email: string;
  metadata: any;
  currency: string;
  callback_url: string;
  plan: string;
};

export type PlanResponse = {
  status: boolean;
  message: string;
  data: any;
};

export type VerificationResponse = {
  status: boolean;
  message: string;
  data?: any;
};

export type VerifyAccountNumberDto = {
  accountNumber: string;
  bankCode: string;
};

export type CreateTransferRecipientDto = {
  type: string;
  name?: string;
  account_number: string;
  bank_code: string;
  currency: string;
};

export type InitTransferDto = {
  source: string;
  amount: number;
  recipient: string;
  reference: string;
};

export class WebhookDto<T> {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsNotEmpty()
  data: T;
}
