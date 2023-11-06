import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { JwtGuard, Roles, RolesGuard } from 'src/utility/auth';
import { HttpResponse } from 'src/utility/response';
import { AdminService } from './admin.service';
import { PendingApprovalIdDto } from './dto/admin.dto';

@Controller('admin/transactions')
@Roles('ADMIN')
@UseGuards(JwtGuard, RolesGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private response: HttpResponse,
  ) {}

  @Get('dashboard')
  async transactionsDash() {
    const { message, data } = await this.adminService.transactionsDashboard();
    return this.response.okResponse(message, data);
  }

  @Get('pending-approval')
  async getAllPendingApprovalTransactions() {
    const { message, data } =
      await this.adminService.getAllPendingApprovalTransactions();
    return this.response.okResponse(message, data);
  }

  @Get('pending-approval/:pending_aproval_id')
  async getPendingApprovalTransaction(@Param() param: PendingApprovalIdDto) {
    const { message, data } =
      await this.adminService.getPendingApprovalTransaction(param);
    return this.response.okResponse(message, data);
  }

  @Get('pending-approval/:pending_aproval_id/approve')
  async approvePendingApprovalTransaction(
    @Param() param: PendingApprovalIdDto,
  ) {
    const { message, data } =
      await this.adminService.approvePendingApprovalTransaction(param);
    return this.response.okResponse(message, data);
  }

  @Get('pending-approval/:pending_aproval_id/reject')
  async rejectPendingApprovalTransaction(@Param() param: PendingApprovalIdDto) {
    const { message, data } =
      await this.adminService.rejectPendingApprovalTransaction(param);
    return this.response.okResponse(message, data);
  }
}
