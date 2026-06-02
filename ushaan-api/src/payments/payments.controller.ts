import { Controller, Get, Post, Patch, Body, Param, Query, Request, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

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
  getMyDues(@Request() req) {
    return this.paymentsService.getMemberDueHistory(req.user.id);
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
  @Roles('accountant', 'admin')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
    @Request() req,
  ) {
    return this.paymentsService.updatePaymentStatus(id, req.user.id, dto);
  }
}