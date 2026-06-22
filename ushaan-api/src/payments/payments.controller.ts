import { Controller, Get, Post, Patch, Body, Param, Query, Request, ParseIntPipe, UseGuards, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ManualPaymentDto } from './dto/manual-payment.dto';
import { MemberOpeningBalanceDto } from './dto/member-opening-balance.dto';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ✅ Member — payment submit করো
  @Post()
  createPayment(@Body() dto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.createPayment(req.user.id, dto);
  }

  // ✅ Member — নিজের payments দেখো
  @Get('my')
  getMyPayments(@Request() req) {
    return this.paymentsService.getMyPayments(req.user.id);
  }

  // ✅ Member — নিজের due history দেখো
  @Get('my/dues')
  getMyDues(
    @Request() req,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.paymentsService.getMemberDueHistory(req.user.id, month, year);
  }

  // ✅ Admin/Accountant — member's due history দেখো
  @Get('dues/:userId')
  @Roles('admin', 'accountant')
  getMemberDues(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.paymentsService.getMemberDueHistory(userId, month, year);
  }

  // ✅ Next unpaid month checking for self
  @Get('my/next-unpaid')
  getMyNextUnpaid(@Request() req) {
    return this.paymentsService.getNextUnpaidMonthAndYear(req.user.id);
  }

  // ✅ Admin/Accountant — member's next unpaid month checking
  @Get('next-unpaid/:userId')
  @Roles('admin', 'accountant', 'general_secretary')
  getMemberNextUnpaid(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentsService.getNextUnpaidMonthAndYear(userId);
  }

  // ✅ Accountant — pending payments দেখো
  @Get('pending')
  @Roles('accountant', 'admin')
  getPendingPayments() {
    return this.paymentsService.getPendingPayments();
  }

  // ✅ Accountant — সব payments দেখো
  @Get()
  @Roles('accountant', 'admin', 'general_secretary')
  getAllPayments(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.paymentsService.getAllPayments(month, year);
  }

  // ✅ Accountant — payment approve/reject করো
  @Patch(':id/status')
  @Roles('accountant')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
    @Request() req,
  ) {
    return this.paymentsService.updatePaymentStatus(id, req.user.id, dto);
  }

  // ✅ Admin/Accountant — manually payment add করো (auto approved)
  @Post('manual')
@Roles('admin', 'accountant')
createManualPayment(@Body() dto: ManualPaymentDto, @Request() req) {
  return this.paymentsService.createManualPayment(dto, req.user.id);
}

// ✅ Admin — member opening balance set করো
@Post('opening-balance')
@Roles('admin', 'accountant')
setMemberOpeningBalance(
  @Body() dto: MemberOpeningBalanceDto,
  @Request() req,
) {
  return this.paymentsService.setMemberOpeningBalance(dto, req.user.id);
}

// ✅ সব member এর opening balance দেখো
@Get('opening-balances')
@Roles('admin', 'accountant', 'general_secretary')
getAllOpeningBalances() {
  return this.paymentsService.getAllOpeningBalances();
}

// ✅ Member এর total paid
@Get('total-paid/:userId')
@Roles('admin', 'accountant')
getMemberTotalPaid(@Param('userId', ParseIntPipe) userId: number) {
  return this.paymentsService.getMemberTotalPaid(userId);
}

// ✅ নিজের total paid
@Get('my/total-paid')
getMyTotalPaid(@Request() req) {
  return this.paymentsService.getMemberTotalPaid(req.user.id);
}
@Delete('reset')
@Roles('admin')
async resetPayments() {
  await this.paymentsService.resetAll();
  return { message: 'All payments deleted' };
}

@Delete('opening-balances/reset')
@Roles('admin')
async resetOpeningBalances() {
  await this.paymentsService.resetOpeningBalances();
  return { message: 'All opening balances deleted' };
}
}