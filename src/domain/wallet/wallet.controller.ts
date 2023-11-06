import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/utility/auth';
import { WalletService } from './wallet.service';
import { HttpResponse } from '../../utility/response';
import { GetUser } from 'src/utility/decorator';
import {
  CreateBulkWalletDto,
  CreateWalletDto,
  CreditWalletDto,
  WalletIdDto,
  WalletTransferDto,
} from './dto/wallet.dto';

@Controller('wallet')
@UseGuards(JwtGuard)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private response: HttpResponse,
  ) {}

  @Post('')
  async createWallet(@GetUser() user_id: string, @Body() dto: CreateWalletDto) {
    const { message, data } = await this.walletService.createWallet(
      user_id,
      dto,
    );
    return this.response.createdResponse(data, message);
  }

  @Post('bulk-create')
  async createBulkWallet(
    @GetUser() user_id: string,
    @Body() dto: CreateBulkWalletDto,
  ) {
    const { message, data } = await this.walletService.createBulkWallet(
      user_id,
      dto,
    );
    return this.response.createdResponse(data, message);
  }

  @Get('')
  async getAllUserWallets(@GetUser() user_id: string) {
    const { message, data } =
      await this.walletService.getAllUserWallets(user_id);
    return this.response.okResponse(message, data);
  }

  @Post('/credit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async fundWallet(@GetUser() user_id: string, @Body() dto: CreditWalletDto) {
    const { message, data } = await this.walletService.creditWallet(
      user_id,
      dto,
    );
    return this.response.okResponse(message, data);
  }

  @Post('/transfer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async transferToWallet(
    @GetUser() user_id: string,
    @Body() dto: WalletTransferDto,
  ) {
    const { message, data } = await this.walletService.walletToWalletTransfer(
      user_id,
      dto,
    );
    return this.response.okResponse(message, data);
  }

  @Get('/:wallet_id')
  @HttpCode(HttpStatus.OK)
  async getWalletDetails(
    @GetUser() user_id: string,
    @Param() param: WalletIdDto,
  ) {
    const { message, data } = await this.walletService.getWalletDetails(
      user_id,
      param,
    );
    return this.response.okResponse(message, data);
  }
}
