import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  CreateBulkWalletDto,
  CreateWalletDto,
  CreditWalletDto,
  WalletIdDto,
  WalletTransferDto,
} from './dto/wallet.dto';
import { PrismaDBService } from 'src/helpers/client/prisma.db.client';
import { UserService } from '../user/user.service';
import { PaystackService } from '../payment/paystack/paystack.payment';
import { AuthService } from '../auth/auth.service';
import { Currency, User, Wallet } from '@prisma/client';
import { MOCKEXCHANGERATES } from 'src/config/wallet.config';

@Injectable()
export class WalletService {
  constructor(
    private prismaService: PrismaDBService,
    private userService: UserService,
    private paystackService: PaystackService,
    private authService: AuthService,
  ) {}
  async createWallet(user_id: string, dto: CreateWalletDto) {
    const { currency } = dto;
    const user = await this.userService.getUser({ id: user_id });

    const isCurrencyExist = await this.prismaService.wallet.findFirst({
      where: {
        currency,
        user_id: user.id,
      },
    });

    if (isCurrencyExist)
      throw new BadRequestException(
        `A wallet with currency of type ${currency} already exist for this user`,
      );

    const wallet = await this.prismaService.wallet.create({
      data: {
        user: { connect: { id: user.id } },
        currency,
      },
    });

    return {
      message: 'Wallet created successfully',
      data: wallet,
    };
  }

  async createBulkWallet(user_id: string, dto: CreateBulkWalletDto) {
    const { currencies } = dto;
    console.log('===currencies===', currencies);

    const user = await this.userService.getUser({ id: user_id });

    const existingCurrencies = await this.prismaService.wallet.findMany({
      where: {
        user_id: user.id,
        currency: {
          in: currencies,
        },
      },
    });

    if (existingCurrencies.length > 0) {
      throw new BadRequestException(
        'Currencies already exist in the wallet table.',
      );
    }

    const walletData = currencies.map((currency) => {
      return {
        user_id: user.id, // Replace with the actual user ID
        balance: 0, // You can set the initial balance as required
        currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const createdWallets = await this.prismaService.wallet.createMany({
      data: walletData,
    });

    if (!createdWallets)
      throw new BadRequestException(
        'Unable to create wallet. Please try again',
      );

    const newWallets = await this.prismaService.wallet.findMany({
      where: {
        user_id: user.id,
        currency: {
          in: currencies,
        },
      },
    });

    return {
      message: 'Wallet created successfully',
      data: newWallets,
    };
  }

  async getAllUserWallets(user_id: string) {
    const user = await this.userService.getUser({ id: user_id });

    const wallets = await this.prismaService.wallet.findMany({
      where: { user_id: user.id },
      orderBy: { createdAt: 'desc' },
      include: { transactions: true },
    });

    if (wallets.length == 0)
      return {
        message: 'User currently has no wallet',
        data: '',
      };
    return {
      message: 'Wallets fetched successfully',
      data: wallets,
    };
  }

  async getWalletDetails(user_id: string, param: WalletIdDto) {
    const { id } = await this.userService.getUser({ id: user_id });

    const wallet = await this.prismaService.wallet.findFirst({
      where: { id: param.wallet_id, user_id: id },
      include: { transactions: true },
    });

    if (!wallet)
      throw new BadRequestException(
        'Wallet id is invalid or does not belong to user',
      );

    return {
      message: 'Wallet details fetched successfully',
      data: wallet,
    };
  }

  async creditWallet(user_id: string, dto: CreditWalletDto) {
    const user = await this.userService.getUser({ id: user_id });
    if (!user) throw new BadRequestException('User does not exist');

    const wallet = await this.prismaService.wallet.findFirst({
      where: { id: dto.wallet_id, user_id: user.id },
    });

    if (!wallet)
      throw new BadRequestException(
        'Wallet id is invalid or does not belong to user',
      );

    // Generate metadata for paystack payload
    const metadata = {
      action: 'CreditWallet',
      user_id: user.id,
    };

    const transaction_reference = this.generateRandomReference();

    // Get Paystack Payment Link
    const paymentLink = await this.paystackService.generatePaystackPaymentLink({
      reference: transaction_reference,
      amount: dto.amount,
      email: user.email,
      currency: wallet.currency,
      metadata: metadata,
    });

    //check if payment link was generated
    if (!paymentLink)
      throw new BadRequestException(
        'Could not generate payment links, please retry',
      );

    //create transaction record
    await this.prismaService.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        wallet: { connect: { id: wallet.id } },
        amount: dto.amount,
        reference: transaction_reference,
        category: 'WALLET_FUNDING',
        payment_provider: 'PAYSTACK',
        description: 'Wallet funding',
        currency: wallet.currency,
        meta: metadata,
        type: 'CREDIT',
      },
    });

    return {
      message: 'Funding initiated successfully',
      data: paymentLink.data,
    };
  }

  async walletToWalletTransfer(user_id: string, dto: WalletTransferDto) {
    const user = await this.userService.getUser({ id: user_id });

    // get source and destination wallet
    const sourceWallet = await this.prismaService.wallet.findFirst({
      where: { id: dto.source_wallet_id, user_id: user.id },
    });

    if (!sourceWallet)
      throw new BadRequestException(
        'Wallet id is invalid or does not belong to user',
      );

    const destinationWallet = await this.prismaService.wallet.findFirst({
      where: { id: dto.destination_wallet_id },
      include: { user: true },
    });

    if (!destinationWallet)
      throw new BadRequestException('Destination wallet not found');

    // check if user has enough balance
    if (sourceWallet.balance < dto.amount)
      throw new BadRequestException('Insufficient balance');

    if (!user.transaction_pin)
      throw new BadRequestException(
        'User does not have a transaction pin, kindly set one',
      );

    const pinMatch = await this.authService.comparePassword(
      user.transaction_pin,
      dto.pin,
    );
    if (!pinMatch)
      throw new ForbiddenException('Transaction pin is incorrect.');

    // convert amount to destination currency
    const amountInDestinationCurrency = this.exchangeRateConverter(
      dto.amount,
      sourceWallet.currency,
      destinationWallet.currency,
    );

    // check if wallet transfer is over N1000000
    const amountInNaira = this.exchangeRateConverter(
      dto.amount,
      sourceWallet.currency,
      'NGN',
    );

    if (amountInNaira > 1000000) {
      const { sourceTrx, destTrx } = await this.handleAdminTransferApproval(
        user,
        sourceWallet,
        destinationWallet,
        dto.amount,
        amountInDestinationCurrency,
      );

      return {
        message: 'Transfer pending approval',
        data: {
          sourceTransaction: sourceTrx,
          destinationTransaction: destTrx,
        },
      };
    }

    // generate reference
    const sourceRef = this.generateRandomReference();

    // create transaction record
    const sourceTrx = await this.prismaService.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        wallet: { connect: { id: sourceWallet.id } },
        amount: dto.amount,
        reference: sourceRef,
        type: 'DEBIT',
        description: 'Wallet transfer',
        currency: sourceWallet.currency,
        payment_provider: 'PAYSTACK',
        category: 'TRANSFER',
        status: 'COMPLETED',
      },
    });

    // deduct from source wallet
    await this.prismaService.wallet.update({
      where: { id: sourceWallet.id },
      data: {
        balance: { decrement: dto.amount },
      },
    });

    // generate reference
    const destinationRef = this.generateRandomReference();

    // create transaction record
    const destTrx = await this.prismaService.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        wallet: { connect: { id: destinationWallet.id } },
        amount: amountInDestinationCurrency,
        reference: destinationRef,
        type: 'DEBIT',
        description: 'Wallet transfer',
        currency: destinationWallet.currency,
        payment_provider: 'PAYSTACK',
        category: 'TRANSFER',
        status: 'COMPLETED',
      },
    });

    // add to destination wallet
    await this.prismaService.wallet.update({
      where: { id: destinationWallet.id },
      data: {
        balance: { increment: amountInDestinationCurrency },
      },
    });

    return {
      message: 'Transfer successful',
      data: {
        sourceTransaction: sourceTrx,
        destinationTransaction: destTrx,
      },
    };
  }

  private async handleAdminTransferApproval(
    user: User,
    sourceWallet: Wallet,
    destinationWallet: Wallet & {
      user: User;
    },
    amount: number,
    amountInDestinationCurrency: number,
  ) {
    // generate reference
    const sourceRef = this.generateRandomReference();

    // create transaction record
    const sourceTrx = await this.prismaService.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        wallet: { connect: { id: sourceWallet.id } },
        amount: amount,
        reference: sourceRef,
        type: 'DEBIT',
        description: 'Wallet transfer',
        currency: sourceWallet.currency,
        payment_provider: 'PAYSTACK',
        category: 'TRANSFER',
      },
    });

    // generate reference
    const destinationRef = this.generateRandomReference();

    // create transaction record
    const destTrx = await this.prismaService.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        wallet: { connect: { id: destinationWallet.id } },
        amount: amountInDestinationCurrency,
        reference: destinationRef,
        type: 'CREDIT',
        description: 'Wallet transfer',
        currency: destinationWallet.currency,
        payment_provider: 'PAYSTACK',
        category: 'TRANSFER',
      },
    });

    // send approval request to admin
    await this.prismaService.pendingTransactionApproval.create({
      data: {
        source_transaction: { connect: { id: sourceTrx.id } },
        destination_transaction: { connect: { id: destTrx.id } },
        amount: amount,
      },
    });

    return { sourceTrx, destTrx };
  }

  private generateRandomReference(length = 13) {
    return Array.from(Array(length), () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join('');
  }

  private exchangeRateConverter(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
  ) {
    return parseFloat(
      (amount * MOCKEXCHANGERATES[fromCurrency][toCurrency]).toFixed(2),
    );
  }
}
