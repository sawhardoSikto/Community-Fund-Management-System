import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SheetsService } from 'src/sheets/sheets.service';
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
import { Fine, FineStatus } from '../fines/entities/fine.entity';

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(MemberOpeningBalance)
    private openingBalanceRepo: Repository<MemberOpeningBalance>,
    @InjectRepository(MonthlySheet)  // ✅ add করো
    private sheetRepo: Repository<MonthlySheet>,
    @InjectRepository(Fine)
    private fineRepo: Repository<Fine>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => SheetsService))
    private sheetsService: SheetsService,
    private settingsService: SettingsService,
  ) { }

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
    let totalAmount = user.monthlyAmount * coveredMonths.length;

    let finesTotal = 0;
    let fineIdsStr: string | null = null;
    let fineNoteSuffix = '';

    if (dto.fineIds && dto.fineIds.length > 0) {
      const fines = await this.fineRepo.find({
        where: {
          id: In(dto.fineIds),
          userId,
          status: FineStatus.PENDING,
        },
      });
      finesTotal = fines.reduce((sum, f) => sum + Number(f.amount), 0);
      totalAmount += finesTotal;
      fineIdsStr = JSON.stringify(fines.map(f => f.id));
      if (fines.length > 0) {
        fineNoteSuffix = ` Fines covered: ${fines.map(f => `${f.reason} (${f.amount} ৳)`).join(', ')}`;
      }
    }

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
      note: `${dueMonths.length > 0
        ? `${dto.note ? `${dto.note}. ` : ''}Due months covered: ${dueMonths.map(d => `${d.month}/${d.year}`).join(', ')}`
        : dto.note || ''}${fineNoteSuffix}`,
      status: PaymentStatus.PENDING,
      coveredMonths: JSON.stringify(coveredMonths),
      type: dto.type || 'monthly',
      fineIds: fineIdsStr,
    });
    await this.paymentRepo.save(payment);

    return {
      message: `Payment submitted (${coveredMonths.length} months)`,
      dueMonths: dueMonths.length,
      totalAmount,
      data: payment,
    };
  }

  async getDueStartMonthAndYear(
    userId: number,
    joinDate: Date,
  ): Promise<{ month: number; year: number }> {
    const opening = await this.openingBalanceRepo.findOne({ where: { userId } });
    let startMonth = joinDate.getMonth() + 1;
    let startYear = joinDate.getFullYear();

    if (opening) {
      let nextMonth = Number(opening.upToMonth) + 1;
      let nextYear = Number(opening.upToYear);
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      startMonth = nextMonth;
      startYear = nextYear;
    }

    // Respect system settings opening balance start month/year
    const settings = await this.settingsService.getSettings();
    if (settings) {
      const systemStartMonth = Number(settings.openingMonth) || 1;
      const systemStartYear = Number(settings.openingYear) || 2024;
      if (
        startYear < systemStartYear ||
        (startYear === systemStartYear && startMonth < systemStartMonth)
      ) {
        startMonth = systemStartMonth;
        startYear = systemStartYear;
      }
    }

    return { month: startMonth, year: startYear };
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

    const start = await this.getDueStartMonthAndYear(userId, new Date(user.createdAt));
    const dueMonths: { month: number; year: number }[] = [];
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { year: 'ASC', month: 'ASC' },
    });

    let checkMonth = start.month;
    let checkYear = start.year;

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

  // Accountant — payment approve/reject/revert করো
  async updatePaymentStatus(paymentId: number, accountantId: number, dto: UpdatePaymentDto) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const oldStatus = payment.status;
    const oldMonth = payment.capturedInMonth;
    const oldYear = payment.capturedInYear;

    if (oldStatus === PaymentStatus.APPROVED && oldMonth && oldYear) {
      if (this.sheetsService.isMonthLocked(oldMonth, oldYear)) {
        throw new BadRequestException('Cannot modify or revert a payment from a locked month.');
      }
    }

    if (oldStatus === PaymentStatus.APPROVED && dto.status !== PaymentStatus.APPROVED) {
      if (payment.fineIds) {
        try {
          const fineIds: number[] = JSON.parse(payment.fineIds);
          if (Array.isArray(fineIds) && fineIds.length > 0) {
            await this.fineRepo.update({ id: In(fineIds) }, {
              status: FineStatus.PENDING,
              paidAt: null,
              paymentId: null,
            });
          }
        } catch (err) {
          console.error('Failed to revert fine statuses to pending', err);
        }
      }
    }

    if (dto.status === PaymentStatus.PENDING) {
      payment.status = PaymentStatus.PENDING;
      payment.capturedInMonth = null;
      payment.capturedInYear = null;
      payment.approvedBy = null;
      payment.approvedAt = null;
    } else {
      payment.status = dto.status;
      payment.approvedBy = accountantId;
      if (dto.status === PaymentStatus.APPROVED) {
        payment.approvedAt = new Date();
        const capture = await this.getCaptureMonthAndYear();
        payment.capturedInMonth = capture.month;
        payment.capturedInYear = capture.year;

        if (payment.fineIds) {
          try {
            const fineIds: number[] = JSON.parse(payment.fineIds);
            if (Array.isArray(fineIds) && fineIds.length > 0) {
              await this.fineRepo.update({ id: In(fineIds) }, {
                status: FineStatus.PAID,
                paidAt: new Date(),
                paymentId: payment.id,
              });
            }
          } catch (err) {
            console.error('Failed to update fine statuses to paid', err);
          }
        }
      }
    }

    if (dto.note !== undefined) payment.note = dto.note;
    await this.paymentRepo.save(payment);

    // Notifications
    if (dto.status === PaymentStatus.APPROVED && oldStatus !== PaymentStatus.APPROVED) {
      await this.notificationsService.create(
        payment.userId,
        'আপনার পেমেন্ট অনুমোদিত হয়েছে।',
      );
    } else if (dto.status === PaymentStatus.REJECTED && oldStatus !== PaymentStatus.REJECTED) {
      await this.notificationsService.create(
        payment.userId,
        'আপনার পেমেন্ট বাতিল করা হয়েছে।',
      );
    } else if (dto.status === PaymentStatus.PENDING && oldStatus === PaymentStatus.APPROVED) {
      await this.notificationsService.create(
        payment.userId,
        'আপনার পেমেন্টের অনুমোদন বাতিল করে পেন্ডিং করা হয়েছে।',
      );
    }

    // ✅ ডাইনামিক শিট রিক্যালকুলেট
    if (oldMonth && oldYear) {
      await this.sheetsService.recalculateSheetCascade(oldMonth, oldYear);
    }
    if (payment.capturedInMonth && payment.capturedInYear && (payment.capturedInMonth !== oldMonth || payment.capturedInYear !== oldYear)) {
      await this.sheetsService.recalculateSheetCascade(payment.capturedInMonth, payment.capturedInYear);
    }

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
        sheetWarning = `${payment.month}/${payment.year} এর শিট ইতোমধ্যে প্রকাশিত হয়েছে। অনুগ্রহ করে শিট আপডেট/পাবলিশ চেক করুন।`;
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

    const months = dto.months || [];
    const fineIds = dto.fineIds || [];

    if (months.length === 0 && fineIds.length === 0) {
      throw new BadRequestException('No bills selected for payment');
    }

    // Calculate fines
    let finesTotal = 0;
    let fineNoteSuffix = '';
    if (fineIds.length > 0) {
      const fines = await this.fineRepo.find({
        where: { id: In(fineIds), userId: dto.userId, status: FineStatus.PENDING },
      });
      finesTotal = fines.reduce((sum, f) => sum + Number(f.amount), 0);
      if (fines.length > 0) {
        fineNoteSuffix = `Fines covered: ${fines.map(f => `${f.reason} (${f.amount} ৳)`).join(', ')}`;
      }
    }

    let totalAmount = finesTotal;
    let mainMonth = new Date().getMonth() + 1;
    let mainYear = new Date().getFullYear();
    let coveredMonths: any[] = [];
    let monthsNoteSuffix = '';

    if (months.length > 0) {
      // Sort chronologically
      months.sort((a, b) => (a.year - b.year) || (a.month - b.month));
      const latest = months[months.length - 1];
      mainMonth = latest.month;
      mainYear = latest.year;
      coveredMonths = months;
      totalAmount += user.monthlyAmount * months.length;
      monthsNoteSuffix = `Months covered: ${months.map(m => `${m.month}/${m.year}`).join(', ')}`;
    }

    // Construct Note
    let finalNote = dto.note ? `${dto.note}. ` : '';
    if (monthsNoteSuffix) finalNote += monthsNoteSuffix + '. ';
    if (fineNoteSuffix) finalNote += fineNoteSuffix;

    const capture = await this.getCaptureMonthAndYear();
    
    let approvedDate = new Date();
    if (dto.paymentDate) {
      approvedDate = new Date(dto.paymentDate);
    }

    const payment = this.paymentRepo.create({
      userId: dto.userId,
      month: mainMonth,
      year: mainYear,
      amount: totalAmount,
      paymentMethod: dto.paymentMethod,
      transactionNumber: dto.transactionNumber,
      status: PaymentStatus.APPROVED, // ✅ auto approved
      approvedBy: addedBy,
      approvedAt: approvedDate,
      paymentDate: dto.paymentDate || approvedDate.toISOString().split('T')[0],
      capturedInMonth: capture.month,
      capturedInYear: capture.year,
      coveredMonths: coveredMonths.length > 0 ? JSON.stringify(coveredMonths) : null,
      fineIds: fineIds.length > 0 ? JSON.stringify(fineIds) : null,
      type: months.length > 0 ? 'monthly' : 'fine',
      note: finalNote || 'Manually added by admin/accountant',
    });
    
    await this.paymentRepo.save(payment);

    // Update Fines
    if (fineIds.length > 0) {
      await this.fineRepo.update({ id: In(fineIds) }, {
        status: FineStatus.PAID,
        paidAt: approvedDate,
        paymentId: payment.id,
      });
    }

    await this.notificationsService.create(
      dto.userId,
      `আপনার ম্যানুয়াল পেমেন্ট যুক্ত করা হয়েছে (Total: ${totalAmount} ৳)।`,
    );

    // ✅ ডাইনামিক শিট রিক্যালকুলেট
    if (payment.capturedInMonth && payment.capturedInYear) {
      await this.sheetsService.recalculateSheetCascade(payment.capturedInMonth, payment.capturedInYear);
    }

    return {
      message: `Payment added successfully`,
      totalAmount,
      data: payment
    };
  }

  // Due check এর জন্য — কোন user এই মাসে pay করেছে
  async getPaidUserIdsByMonth(month: number, year: number): Promise<number[]> {
    const payments = await this.paymentRepo.find({
      where: { month, year, status: PaymentStatus.APPROVED },
    });
    return payments.map(p => p.userId);
  }

  // Member এর due list বানাও
  async getMemberDueHistory(userId: number, month?: number, year?: number) {
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { year: 'ASC', month: 'ASC' },
    });

    const now = new Date();
    const currentMonth = month ? Number(month) : now.getMonth() + 1;
    const currentYear = year ? Number(year) : now.getFullYear();

    // user এর join month থেকে এখন পর্যন্ত check করো
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const start = await this.getDueStartMonthAndYear(userId, new Date(user.createdAt));
    const dueList: { month: number; year: number; amount: number }[] = [];;
    let checkMonth = start.month;
    let checkYear = start.year;

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

  // ✅ Member এর সব বকেয়া, জরিমানা এবং অগ্রিম মাস বের করো (For CheckList UI)
  async getMemberBills(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Get Dues (up to current month)
    const dueHistoryRes = await this.getMemberDueHistory(userId, currentMonth, currentYear);
    const dues = dueHistoryRes.data.map(d => ({
      id: `due_${d.month}_${d.year}`,
      type: 'monthly',
      month: d.month,
      year: d.year,
      amount: d.amount,
      label: `Monthly Subscription - ${new Date(d.year, d.month - 1).toLocaleString('default', { month: 'long' })} ${d.year}`,
    }));

    // 2. Get Fines
    const fines = await this.fineRepo.find({
      where: { userId, status: FineStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    const mappedFines = fines.map(f => ({
      id: `fine_${f.id}`,
      fineId: f.id,
      type: 'fine',
      amount: Number(f.amount),
      label: `Fine: ${f.reason || 'Penalty'}`,
    }));

    // 3. Get Advances (next 12 unpaid months after dues)
    let nextUnpaidMonth = currentMonth;
    let nextUnpaidYear = currentYear;
    
    // Start after the last due month or current month
    if (dues.length > 0) {
      const lastDue = dues[dues.length - 1];
      nextUnpaidMonth = lastDue.month + 1;
      nextUnpaidYear = lastDue.year;
      if (nextUnpaidMonth > 12) {
        nextUnpaidMonth = 1;
        nextUnpaidYear++;
      }
    } else {
      // Find the actual next unpaid month if no dues exist
      const nextUnpaidRes = await this.getNextUnpaidMonthAndYear(userId);
      if (nextUnpaidRes) {
        nextUnpaidMonth = nextUnpaidRes.month;
        nextUnpaidYear = nextUnpaidRes.year;
      } else {
        // Fallback
        nextUnpaidMonth++;
        if (nextUnpaidMonth > 12) {
          nextUnpaidMonth = 1;
          nextUnpaidYear++;
        }
      }
    }

    const advances: any[] = [];
    let cm = nextUnpaidMonth;
    let cy = nextUnpaidYear;
    for (let i = 0; i < 12; i++) {
      advances.push({
        id: `advance_${cm}_${cy}`,
        type: 'advance',
        month: cm,
        year: cy,
        amount: user.monthlyAmount,
        label: `Advance - ${new Date(cy, cm - 1).toLocaleString('default', { month: 'long' })} ${cy}`,
      });
      cm++;
      if (cm > 12) {
        cm = 1;
        cy++;
      }
    }

    return {
      dues,
      fines: mappedFines,
      advances,
    };
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

    const start = await this.getDueStartMonthAndYear(userId, new Date(user.createdAt));
    const dues: { month: number; year: number }[] = [];
    let checkMonth = start.month;
    let checkYear = start.year;
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

    if (payment.type === 'fine') {
      if (!payment.coveredMonths) {
        return false;
      }
      try {
        const covered = JSON.parse(payment.coveredMonths);
        if (!Array.isArray(covered) || covered.length === 0) {
          return false;
        }
      } catch {
        return false;
      }
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

  async getCaptureMonthAndYear(): Promise<{ month: number; year: number }> {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  async getNextUnpaidMonthAndYear(userId: number): Promise<{ month: number; year: number }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const start = await this.getDueStartMonthAndYear(userId, new Date(user.createdAt));
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { year: 'ASC', month: 'ASC' },
    });

    let checkMonth = start.month;
    let checkYear = start.year;

    while (true) {
      const paid = payments.find((p) =>
        this.paymentCoversMonth(p, checkMonth, checkYear)
      );

      if (!paid) {
        return { month: checkMonth, year: checkYear };
      }

      checkMonth++;
      if (checkMonth > 12) {
        checkMonth = 1;
        checkYear++;
      }
    }
  }

  async getPendingFinesForUser(userId: number): Promise<Fine[]> {
    return this.fineRepo.find({
      where: { userId, status: FineStatus.PENDING },
    });
  }
}