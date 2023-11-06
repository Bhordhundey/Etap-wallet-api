import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { PrismaDBService } from 'src/helpers/client/prisma.db.client';
import { PendingApprovalIdDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prismaService: PrismaDBService) {}

  async transactionsDashboard() {
    //get monthly transaction summaries
    const allTransactions = await this.prismaService.transaction.findMany({
      where: {
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        wallet: true,
      },
    });

    const monthlySummaryInit: Record<string, Transaction[]> = {};

    allTransactions.forEach((trx) => {
      const createdAt = new Date(trx.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1;

      const key = `${year}-${month}`;

      if (monthlySummaryInit[key]) {
        monthlySummaryInit[key].push(trx);
      } else {
        monthlySummaryInit[key] = [trx];
      }
    });

    let monthlySummary = {};

    monthlySummary = Object.entries(monthlySummaryInit).map(([key, value]) => {
      const transactions = value;

      const walletFundingTransactions = transactions.filter(
        (trx) => trx.category === 'WALLET_FUNDING',
      );

      const walletFundingAmount = walletFundingTransactions.reduce(
        (acc, trx) => acc + trx.amount,
        0,
      );

      const creditWalletTransferTransactions = transactions.filter(
        (trx) => trx.category === 'TRANSFER' && trx.type === 'CREDIT',
      );

      const creditWalletTransferAmount =
        creditWalletTransferTransactions.reduce(
          (acc, trx) => acc + trx.amount,
          0,
        );

      const debitWalletTransferTransactions = transactions.filter(
        (trx) => trx.category === 'TRANSFER' && trx.type === 'DEBIT',
      );

      const debitWalletTransferAmount = debitWalletTransferTransactions.reduce(
        (acc, trx) => acc + trx.amount,
        0,
      );

      return {
        [key]: {
          wallet_credit: {
            data: walletFundingTransactions,
            amount: walletFundingAmount,
            count: walletFundingTransactions.length,
          },
          wallet_transfer: {
            credit: {
              data: creditWalletTransferTransactions,
              amount: creditWalletTransferAmount,
              count: creditWalletTransferTransactions.length,
            },
            debit: {
              data: debitWalletTransferTransactions,
              amount: debitWalletTransferAmount,
              count: debitWalletTransferTransactions.length,
            },
          },
        },
      };
    });

    return {
      message: 'Transaction dashboard data fetched successfully',
      data: monthlySummary,
    };
  }

  async getAllPendingApprovalTransactions() {
    const transactions =
      await this.prismaService.pendingTransactionApproval.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          source_transaction: true,
          destination_transaction: true,
        },
      });

    return {
      message: 'Pending approval transactions fetched successfully',
      data: transactions,
    };
  }

  async getPendingApprovalTransaction(param: PendingApprovalIdDto) {
	console.log("===param2===", param);
	
    const transaction =
      await this.prismaService.pendingTransactionApproval.findUnique({
        where: {
          id: param.pending_aproval_id,
        },
        include: {
          source_transaction: true,
          destination_transaction: true,
        },
      });

    if (!transaction)
      throw new NotFoundException('Pending approval transaction not found');

    return {
      message: 'Pending approval transaction fetched successfully',
      data: transaction,
    };
  }

  async approvePendingApprovalTransaction(param: PendingApprovalIdDto) {
    const transaction =
      await this.prismaService.pendingTransactionApproval.findUnique({
        where: {
          id: param.pending_aproval_id,
        },
        include: {
          source_transaction: true,
          destination_transaction: true,
        },
      });

    if (!transaction)
      throw new NotFoundException('Pending approval transaction not found');

    if (transaction.status !== 'PENDING')
      throw new BadRequestException(
        'Pending approval transaction has already been approved or rejected',
      );

    const { source_transaction, destination_transaction } = transaction;

    // Update source wallet
    await this.prismaService.wallet.update({
      where: {
        id: source_transaction.wallet_id,
      },
      data: {
        balance: {
          decrement: source_transaction.amount,
        },
      },
    });

    // Update source transaction
    const sourceTrx = await this.prismaService.transaction.update({
      where: {
        id: source_transaction.id,
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // Update destination wallet
    await this.prismaService.wallet.update({
      where: {
        id: destination_transaction.wallet_id,
      },
      data: {
        balance: {
          increment: destination_transaction.amount,
        },
      },
    });

    // Update destination transaction
    const destTrx = await this.prismaService.transaction.update({
      where: {
        id: destination_transaction.id,
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // Update pending approval transaction
    await this.prismaService.pendingTransactionApproval.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: 'APPROVED',
      },
    });

    return {
      message: 'Pending approval transaction approved successfully',
      data: {
        sourceTransaction: sourceTrx,
        destTransaction: destTrx,
      },
    };
  }

  async rejectPendingApprovalTransaction(param: PendingApprovalIdDto) {
    const transaction =
      await this.prismaService.pendingTransactionApproval.findUnique({
        where: {
          id: param.pending_aproval_id,
        },
        include: {
          source_transaction: true,
          destination_transaction: true,
        },
      });

    if (!transaction)
      throw new NotFoundException('Pending approval transaction not found');

    if (transaction.status !== 'PENDING')
      throw new BadRequestException(
        'Pending approval transaction has already been approved or rejected',
      );

    // Update source transaction
    const sourceTrx = await this.prismaService.transaction.update({
      where: {
        id: transaction.source_transaction.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    // Update destination transaction
    const destTrx = await this.prismaService.transaction.update({
      where: {
        id: transaction.destination_transaction.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    // Update pending approval transaction
    await this.prismaService.pendingTransactionApproval.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: 'DECLINED',
      },
    });

    return {
      message: 'Pending approval transaction rejected successfully',
      data: {
        sourceTransaction: sourceTrx,
        destTransaction: destTrx,
      },
    };
  }
}
