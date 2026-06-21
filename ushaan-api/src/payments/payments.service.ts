import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
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
import { MonthlySheet, SheetStatus } from 'src/sheets/entities/monthly-sheet.entity';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
@Injectable()
export class PaymentsService implements OnModuleInit {
constructor(
  @InjectRepository(Payment)
  private paymentRepo: Repository<Payment>,
  @InjectRepository(MemberOpeningBalance)
  private openingBalanceRepo: Repository<MemberOpeningBalance>,
  @InjectRepository(MonthlySheet)  // ✅ add করো
  private sheetRepo: Repository<MonthlySheet>,
  private usersService: UsersService,
  private notificationsService: NotificationsService,
) {}

  async onModuleInit() {
    try {
      // Migrate existing approved payments to set capturedInMonth, capturedInYear, and approvedAt if they are null
      await this.paymentRepo.query(
        `UPDATE payment SET "capturedInMonth" = month, "capturedInYear" = year, "approvedAt" = "createdAt" WHERE status = 'approved' AND "capturedInMonth" IS NULL`
      );
    } catch (err) {
      console.error('Failed to migrate existing payments capturedInMonth/capturedInYear', err);
    }
  }

  // Member — payment submit করো
async createPayment(userId: number, dto: CreatePaymentDto) {
  const user = await this.usersService.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  // ১. Due months খোঁজো
  const dueMonths = await this.getDueMonths(userId, dto.month, dto.year);
  const coveredMonths = [
    ...dueMonths,
    { month: dto.month, year: dto.year },
  ];
  const totalAmount = user.monthlyAmount * coveredMonths.length;

  // ২. Current month already paid?
  const existing = await this.paymentRepo.findOne({
    where: [
      { userId, month: dto.month, year: dto.year, status: PaymentStatus.APPROVED },
      { userId, month: dto.month, year: dto.year, status: PaymentStatus.PENDING },
    ],
  });
  if (existing) throw new BadRequestException(
    `Payment for ${dto.month}/${dto.year} already submitted`
  );
  // ৩. Single bundled payment create করো
  const payment = this.paymentRepo.create({
    userId,
    month: dto.month,
    year: dto.year,
    amount: totalAmount,
    paymentMethod: dto.paymentMethod,
    transactionNumber: dto.transactionNumber,
    note: dueMonths.length > 0
      ? `${dto.note ? `${dto.note}. ` : ''}Due months covered: ${dueMonths.map(d => `${d.month}/${d.year}`).join(', ')}`
      : dto.note,
    status: PaymentStatus.PENDING,
    coveredMonths: JSON.stringify(coveredMonths),
  });
  await this.paymentRepo.save(payment);

  return {
    message: `Payment submitted (${coveredMonths.length} months)`,
    dueMonths: dueMonths.length,
    totalAmount,
    data: payment,
  };
}

// Due months calculate করো
private async getDueMonths(
  userId: number,
  currentMonth: number,
  currentYear: number,
) {
  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const joinDate = new Date(user.createdAt);
  const joinMonth = joinDate.getMonth() + 1;
  const joinYear = joinDate.getFullYear();

  const dueMonths: { month: number; year: number }[] = [];
  const payments = await this.paymentRepo.find({
    where: { userId },
    order: { year: 'ASC', month: 'ASC' },
  });

  let checkMonth = joinMonth;
  let checkYear = joinYear;

  while (
    checkYear < currentYear ||
    (checkYear === currentYear && checkMonth < currentMonth)
  ) {
    const paid = payments.find((payment) =>
      this.paymentCoversMonth(payment, checkMonth, checkYear)
    );

    if (!paid) {
      dueMonths.push({
        month: checkMonth,
        year: checkYear,
      });
    }

    checkMonth++;

    if (checkMonth > 12) {
      checkMonth = 1;
      checkYear++;
    }
  }

  return dueMonths;
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
  if (dto.status === PaymentStatus.APPROVED) {
    payment.approvedAt = new Date();
    const capture = await this.getCaptureMonthAndYear(payment.month, payment.year);
    payment.capturedInMonth = capture.month;
    payment.capturedInYear = capture.year;
  }
  if (dto.note) payment.note = dto.note;
  await this.paymentRepo.save(payment);
  if (dto.status === PaymentStatus.APPROVED) {
  await this.notificationsService.create(
    payment.userId,
    'আপনার পেমেন্ট অনুমোদিত হয়েছে।',
  );
}
if (dto.status === PaymentStatus.REJECTED) {
  await this.notificationsService.create(
    payment.userId,
    'আপনার পেমেন্ট বাতিল করা হয়েছে।',
  );
}

  // ✅ Approved হলে check করো sheet published কিনা
  let sheetWarning: string | null = null;
  if (dto.status === PaymentStatus.APPROVED) {
    const publishedSheet = await this.sheetRepo.findOne({
      where: {
        month: payment.month,
        year: payment.year,
        status: SheetStatus.PUBLISHED,
      },
    });
    if (publishedSheet) { 
      sheetWarning = `${payment.month}/${payment.year} এর শিট ইতোমধ্যে প্রকাশিত হয়েছে। অনুগ্রহ করে শিট regenerate করুন।`;
    }
  }

  return {
    message: `Payment ${dto.status}`,
    sheetWarning,
    data: payment,
  };
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

  const capture = await this.getCaptureMonthAndYear(dto.month, dto.year);

  const payment = this.paymentRepo.create({
    userId: dto.userId,
    month: dto.month,
    year: dto.year,
    amount: user.monthlyAmount,
    paymentMethod: dto.paymentMethod,
    transactionNumber: dto.transactionNumber,
    status: PaymentStatus.APPROVED, // ✅ auto approved
    approvedBy: addedBy,
    approvedAt: new Date(),
    capturedInMonth: capture.month,
    capturedInYear: capture.year,
    note: dto.note || 'Manually added by admin/accountant',
  });
  await this.paymentRepo.save(payment);
  await this.notificationsService.create(
  dto.userId,
  `আপনার ${dto.month}/${dto.year} মাসের পেমেন্ট যুক্ত করা হয়েছে।`,
);

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
      const paid = payments.find((p) =>
        this.paymentCoversMonth(p, checkMonth, checkYear)
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

async resetAll() {
  await this.paymentRepo.query('DELETE FROM payment');
}

async resetOpeningBalances() {
  await this.openingBalanceRepo.query('DELETE FROM member_opening_balance');
}
async getMemberDuesUpToMonth(userId: number, month: number, year: number) {
  const user = await this.usersService.findById(userId);
  if (!user) return [];

  const joinDate = new Date(user.createdAt);
  const joinMonth = joinDate.getMonth() + 1;
  const joinYear = joinDate.getFullYear();

  const dues: { month: number; year: number }[] = [];
  let checkMonth = joinMonth;
  let checkYear = joinYear;
  const payments = await this.paymentRepo.find({
    where: { userId },
    order: { year: 'ASC', month: 'ASC' },
  });

  while (
    checkYear < year ||
    (checkYear === year && checkMonth < month)
  ) {
    const paid = payments.find((p) =>
      this.paymentCoversMonth(p, checkMonth, checkYear)
    );

    if (!paid) {
      dues.push({ month: checkMonth, year: checkYear });
    }

    checkMonth++;
    if (checkMonth > 12) { checkMonth = 1; checkYear++; }
  }

  return dues;
}

paymentCoversMonth(payment: Payment, month: number, year: number) {
  if (payment.status !== PaymentStatus.APPROVED && payment.status !== PaymentStatus.PENDING) {
    return false;
  }

  if (payment.month === month && payment.year === year) {
    return true;
  }

  if (!payment.coveredMonths) {
    return false;
  }

  try {
    const coveredMonths = JSON.parse(payment.coveredMonths) as Array<{ month: number; year: number }>;
    return coveredMonths.some((covered) => covered.month === month && covered.year === year);
  } catch {
    return false;
  }
}

async getApprovedPaymentsForUser(userId: number) {
  return this.paymentRepo.find({
    where: { userId, status: PaymentStatus.APPROVED },
    order: { year: 'ASC', month: 'ASC' },
  });
}

async getApprovedPaymentsCapturedInMonth(month: number, year: number) {
  return this.paymentRepo.find({
    where: { capturedInMonth: month, capturedInYear: year, status: PaymentStatus.APPROVED },
    relations: { user: true },
  });
}

async getCaptureMonthAndYear(targetMonth: number, targetYear: number): Promise<{ month: number; year: number }> {
  // 1. Check if the sheet for targetMonth/targetYear is published
  const targetSheet = await this.sheetRepo.findOne({
    where: { month: targetMonth, year: targetYear, status: SheetStatus.PUBLISHED }
  });
  
  if (!targetSheet) {
    // Not published yet, so it can be captured in its own target month
    return { month: targetMonth, year: targetYear };
  }
  
  // 2. It is published. Find the latest published sheet overall
  const latestPublishedSheet = await this.sheetRepo.findOne({
    where: { status: SheetStatus.PUBLISHED },
    order: { year: 'DESC', month: 'DESC' }
  });
  
  if (!latestPublishedSheet) {
    // Fallback
    return { month: targetMonth, year: targetYear };
  }
  
  // The next month after the latest published sheet
  let nextMonth = latestPublishedSheet.month + 1;
  let nextYear = latestPublishedSheet.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  
  return { month: nextMonth, year: nextYear };
}
}