import { Currency } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateWalletDto {
  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;
}

export class CreateBulkWalletDto {
  @IsNotEmpty()
  @IsArray()
  @IsEnum(Currency, { each: true })
  currencies: Currency[];
}

export class WalletIdDto {
  @IsNotEmpty()
  @IsString()
  wallet_id: string;
}

export class CreditWalletDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  wallet_id: string;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class WalletTransferDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  source_wallet_id: string;

  @IsString()
  @IsNotEmpty()
  destination_wallet_id: string;

  @IsString()
  @IsNotEmpty()
  pin: string;
}
