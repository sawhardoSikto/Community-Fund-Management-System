import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { UsersService } from '../users/users.service';
import { ManualPaymentDto } from './dto/manual-payment.dto';
import { MemberOpeningBalance } from './entities/member-opening-balance.entity';
import { MemberOpeningBalanceDto } from './dto/member-opening-balance.dto';
import { User } from '../users/entities/user.entity';
@Injectable()
export class PaymentsService {
constructor(
  @InjectRepository(Payment)
  private paymentRepo: Repository<Payment>,
  @InjectRepository(MemberOpeningBalance)
  private openingBalanceRepo: Repository<MemberOpeningBalance>,
  private usersService: UsersService,
) {}

  // Member — payment submit করো
  async createPayment(userId: number, dto: CreatePaymentDto) {
    // ১. user আছে কিনা check
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // ২. এই মাসে already payment করেছে কিনা check
    const existing = await this.paymentRepo.findOne({
      where: { userId, month: dto.month, year: dto.year },
    });
    if (existing) throw new BadRequestException(
      `Payment for ${dto.month}/${dto.year} already submitted`
    );

    // ৩. payment বানাও
    const payment = this.paymentRepo.create({
      userId,
      month: dto.month,
      year: dto.year,
      amount: user.monthlyAmount,
      paymentMethod: dto.paymentMethod,
      transactionNumber: dto.transactionNumber,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepo.save(payment);

    return { message: 'Payment submitted! Waiting for approval.', data: payment };
  }

  // Member — নিজের payments দেখো
  async getMyPayments(userId: number) {
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { year: 'DESC', month: 'DESC' },
    });
    return { message: 'Payments fetched', count: payments.length, data: payments };
  }

  // Accountant — সব pending payments দেখো
  async getPendingPayments() {
    const payments = await this.paymentRepo.find({
      where: { status: PaymentStatus.PENDING },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    return { message: 'Pending payments fetched', count: payments.length, data: payments };
  }

  // Accountant — সব payments দেখো
  async getAllPayments(month?: number, year?: number) {
    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;

    const payments = await this.paymentRepo.find({
      where,
      relations: { user: true },
      order: { year: 'DESC', month: 'DESC', createdAt: 'DESC' },
    });
    return { message: 'All payments fetched', count: payments.length, data: payments };
  }

  // Accountant — payment approve/reject করো
  async updatePaymentStatus(paymentId: number, accountantId: number, dto: UpdatePaymentDto) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }

    payment.status = dto.status;
    payment.approvedBy = accountantId;
    if (dto.note) payment.note = dto.note;
    await this.paymentRepo.save(payment);

    return { message: `Payment ${dto.status}`, data: payment };
  }

  // Sheet generate এর জন্য — একটা মাসের approved payments
  async getApprovedPaymentsByMonth(month: number, year: number) {
    return this.paymentRepo.find({
      where: { month, year, status: PaymentStatus.APPROVED },
      relations: { user: true },
    });
  }

  // Admin/Accountant — manually payment add করো (auto approved)
async createManualPayment(dto: ManualPaymentDto, addedBy: number) {
  const user = await this.usersService.findById(dto.userId);
  if (!user) throw new NotFoundException('User not found');

  const existing = await this.paymentRepo.findOne({
    where: { userId: dto.userId, month: dto.month, year: dto.year },
  });
  if (existing) throw new BadRequestException(
    `Payment for ${dto.month}/${dto.year} already exists for this user`
  );

  const payment = this.paymentRepo.create({
    userId: dto.userId,
    month: dto.month,
    year: dto.year,
    amount: user.monthlyAmount,
    paymentMethod: dto.paymentMethod,
      transactionNumber: dto.transactionNumber,
    status: PaymentStatus.APPROVED, // ✅ auto approved
    approvedBy: addedBy,
    note: dto.note || 'Manually added by admin/accountant',
  });
  await this.paymentRepo.save(payment);

  return { message: 'Payment added successfully', data: payment };
}

  // Due check এর জন্য — কোন user এই মাসে pay করেছে
  async getPaidUserIdsByMonth(month: number, year: number): Promise<number[]> {
    const payments = await this.paymentRepo.find({
      where: { month, year, status: PaymentStatus.APPROVED },
    });
    return payments.map(p => p.userId);
  }

  // Member এর due list বানাও
  async getMemberDueHistory(userId: number) {
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { year: 'ASC', month: 'ASC' },
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // user এর join month থেকে এখন পর্যন্ত check করো
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const joinDate = new Date(user.createdAt);
    const joinMonth = joinDate.getMonth() + 1;
    const joinYear = joinDate.getFullYear();

    const dueList: { month: number; year: number; amount: number }[] = [];;
    let checkYear = joinYear;
    let checkMonth = joinMonth;

    while (
      checkYear < currentYear ||
      (checkYear === currentYear && checkMonth <= currentMonth)
    ) {
      const paid = payments.find(
        p => p.month === checkMonth && p.year === checkYear
          && p.status === PaymentStatus.APPROVED
      );

      if (!paid) {
        dueList.push({ month: checkMonth, year: checkYear, amount: user.monthlyAmount });
      }

      checkMonth++;
      if (checkMonth > 12) { checkMonth = 1; checkYear++; }
    }

    return { message: 'Due history fetched', count: dueList.length, data: dueList };
  }


  // ✅ Member opening balance set করো
async setMemberOpeningBalance(dto: MemberOpeningBalanceDto, adminId: number) {
  const user = await this.usersService.findById(dto.userId);
  if (!user) throw new NotFoundException('User not found');

  // আগে আছে কিনা check করো
  const existing = await this.openingBalanceRepo.findOne({
    where: { userId: dto.userId },
  });

  if (existing) {
    await this.openingBalanceRepo.update(existing.id, {
      totalPaid: dto.totalPaid,
      upToMonth: dto.upToMonth,
      upToYear: dto.upToYear,
      setBy: adminId,
    });
  } else {
    const balance = this.openingBalanceRepo.create({
      ...dto,
      setBy: adminId,
    });
    await this.openingBalanceRepo.save(balance);
  }

  return { message: 'Member opening balance set successfully' };
}

// ✅ সব member এর opening balance দেখো
async getAllOpeningBalances() {
  return this.openingBalanceRepo.find({
    relations: { user: true },
    order: { createdAt: 'DESC' },
  });
}

// ✅ একজন member এর opening balance দেখো
async getMemberOpeningBalance(userId: number) {
  return this.openingBalanceRepo.findOne({
    where: { userId },
  });
}

// ✅ Member এর total paid (opening + website)
async getMemberTotalPaid(userId: number) {
  const opening = await this.getMemberOpeningBalance(userId);
  const openingTotal = opening ? Number(opening.totalPaid) : 0;

  const websitePayments = await this.paymentRepo.find({
    where: { userId, status: PaymentStatus.APPROVED },
  });
  const websiteTotal = websitePayments.reduce(
    (sum, p) => sum + Number(p.amount), 0
  );

  return {
    openingTotal,
    websiteTotal,
    grandTotal: openingTotal + websiteTotal,
  };
}
}