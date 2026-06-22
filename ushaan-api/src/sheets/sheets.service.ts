import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlySheet, SheetStatus } from './entities/monthly-sheet.entity';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { PaymentsService } from '../payments/payments.service';
import { ProjectsService } from '../projects/projects.service';
import { SalariesService } from '../salaries/salaries.service';
import { UsersService } from '../users/users.service';
import { SettingsService } from 'src/settings/settings.service';
import { ExpensesService } from 'src/expenses/expenses.service';
import { NotificationsService } from 'src/notifications/notifications.service';


@Injectable()
export class SheetsService {
  constructor(
    @InjectRepository(MonthlySheet)
    private sheetRepo: Repository<MonthlySheet>,
    private paymentsService: PaymentsService,
    private projectsService: ProjectsService,
    private salariesService: SalariesService,
    private usersService: UsersService,
    private settingsService: SettingsService,
    private expensesService: ExpensesService, // ✅ নতুন
    private notificationsService: NotificationsService, // ✅ নতুন
  ) {}

  // Sheet generate করো (draft)
 async generateSheet(dto: CreateSheetDto, accountantId: number) {
  const existing = await this.sheetRepo.findOne({
    where: { month: dto.month, year: dto.year },
  });
  if (existing) throw new BadRequestException(
    `Sheet for ${dto.month}/${dto.year} already exists`
  );

  // ১. Member payments
  const payments = await this.paymentsService.getApprovedPaymentsCapturedInMonth(
    dto.month, dto.year
  );
  const totalMemberIncome = payments.reduce(
    (sum, p) => sum + Number(p.amount), 0
  );

  // ২. Project income (profit + capital_return)
  const projectIncomes = await this.projectsService.getProjectIncomeByMonth(
    dto.month, dto.year
  );
  const totalProjectIncome = projectIncomes.reduce(
    (sum, t) => sum + Number(t.amount), 0
  );
  const capitalReturns = await this.projectsService.getCapitalReturnByMonth(
  dto.month,
  dto.year,
);

const totalCapitalReturn = capitalReturns.reduce(
  (sum, t) => sum + Number(t.amount),
  0,
);
  // ✅ ৩. Project expense (invest) — এই মাসে কত invest হয়েছে
  const projectExpenses = await this.projectsService.getProjectExpenseByMonth(
    dto.month, dto.year
  );
  const totalProjectExpense = projectExpenses.reduce(
    (sum, t) => sum + Number(t.amount), 0
  );

  // ৪. Salary
  const salaries = await this.salariesService.getSalariesByMonth(
    dto.month, dto.year
  );
  const totalSalary = salaries.reduce(
    (sum, s) => sum + Number(s.amount), 0
  );
  // ✅ General Expense
const totalGeneralExpense = await this.expensesService.getTotalExpenseByMonth(
  dto.month, dto.year
);

  // ৫. Previous balance
  const previousSheet = await this.getPreviousSheet(dto.month, dto.year);
  const previousBalance = previousSheet
    ? Number(previousSheet.cashInHand)
    : Number((await this.settingsService.getSettings()).openingCashInHand);

  // ✅ ৬. Cash in Hand = previous + member + project income - salary - project expense
  const cashInHand = previousBalance
  + totalMemberIncome
  + totalProjectIncome
  + totalCapitalReturn
  - totalSalary
  - totalProjectExpense
  - totalGeneralExpense;

  // ✅ ৭. Total Invested = সব project এ stillOutside
  const totalInvested = await this.projectsService.getOverallInvestedAmount();

  // ✅ ৮. Total Asset
  const totalAsset = cashInHand + totalInvested;

  const sheet = this.sheetRepo.create({
    month: dto.month,
    year: dto.year,
    totalMemberIncome,
    totalProjectIncome,
    totalProjectExpense, // ✅
    totalSalary,
    previousBalance,
    totalGeneralExpense, // ✅
    cashInHand,
    totalInvested,
    totalAsset,
    status: SheetStatus.DRAFT,
    publishedBy: accountantId,
    totalCapitalReturn, // ✅
  });
  await this.sheetRepo.save(sheet);

  return { message: 'Sheet generated (draft)', data: sheet };
}

  // Sheet publish করো
  async publishSheet(id: number, accountantId: number) {
    const sheet = await this.sheetRepo.findOne({ where: { id } });
    if (!sheet) throw new NotFoundException('Sheet not found');
    if (sheet.status === SheetStatus.PUBLISHED) {
      throw new BadRequestException('Sheet already published');
    }

    sheet.status = SheetStatus.PUBLISHED;
    sheet.publishedBy = accountantId;
    sheet.publishedAt = new Date();
    await this.sheetRepo.save(sheet);

    const users = await this.usersService.findAll();
    for (const user of users) {
      await this.notificationsService.createIfNotExists(
        user.id,
        `${sheet.month}/${sheet.year} মাসের শীট প্রকাশ করা হয়েছে।`,
      );
    }

    return { message: 'Sheet published successfully', data: sheet };
  }

  // সব sheets দেখো
  async findAll() {
    const sheets = await this.sheetRepo.find({
      order: { year: 'DESC', month: 'DESC' },
    });
    return { message: 'Sheets fetched', count: sheets.length, data: sheets };
  }

  // একটা sheet এর full details দেখো
  async findOne(id: number) {
    const sheet = await this.sheetRepo.findOne({ where: { id } });
    if (!sheet) throw new NotFoundException('Sheet not found');

    // Full details load করো
    const payments = await this.paymentsService.getApprovedPaymentsCapturedInMonth(
      sheet.month, sheet.year
    );
    const [projectIncomes, projectExpenses, capitalReturns] = await Promise.all([
      this.projectsService.getProjectIncomeByMonth(sheet.month, sheet.year),
      this.projectsService.getProjectExpenseByMonth(sheet.month, sheet.year),
      this.projectsService.getCapitalReturnByMonth(sheet.month, sheet.year),
    ]);

    const projectTransactions = [
      ...projectIncomes,
      ...projectExpenses,
      ...capitalReturns,
    ].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const salaries = await this.salariesService.getSalariesByMonth(
      sheet.month, sheet.year
    );

    const expenses = await this.expensesService.getExpensesByMonthCaptured(
      sheet.month, sheet.year
    );

    // সব users এর payment status
    const allUsers = await this.usersService.findAll();
    const users = allUsers;

    // Member payment status এ due months দেখাও
    const memberPaymentStatus = await Promise.all(
      users.map(async (member) => {
        // Find all approved payments for this user
        const memberApprovedPayments = await this.paymentsService.getApprovedPaymentsForUser(member.id);

        const paidDues: { month: number; year: number }[] = [];
        const unpaidDues: { month: number; year: number }[] = [];

        // Trace from member join date to this sheet's month/year (exclusive)
        const start = await this.paymentsService.getDueStartMonthAndYear(member.id, new Date(member.createdAt));
        let checkMonth = start.month;
        let checkYear = start.year;

        while (checkYear < sheet.year || (checkYear === sheet.year && checkMonth < sheet.month)) {
          const coveringPayment = memberApprovedPayments.find(p =>
            this.paymentsService.paymentCoversMonth(p, checkMonth, checkYear)
          );

          if (coveringPayment) {
            // Determine the capture date of the payment
            const capYear = coveringPayment.capturedInYear ?? coveringPayment.year;
            const capMonth = coveringPayment.capturedInMonth ?? coveringPayment.month;
            // If captured on or before the sheet date, consider it paid for that month
            if (capYear < sheet.year || (capYear === sheet.year && capMonth <= sheet.month)) {
              paidDues.push({ month: checkMonth, year: checkYear });
            } else {
              // Captured after the sheet date, still unpaid for this month
              unpaidDues.push({ month: checkMonth, year: checkYear });
            }
          } else {
            // No payment covering this month
            unpaidDues.push({ month: checkMonth, year: checkYear });
          }

          // Increment month/year
          checkMonth++;
          if (checkMonth > 12) {
            checkMonth = 1;
            checkYear++;
          }
        }

        // Check if the current month is paid
        const currentPayment = memberApprovedPayments.find(p =>
          this.paymentsService.paymentCoversMonth(p, sheet.month, sheet.year)
        );

        const paidCurrent = !!currentPayment;
        const paid = paidCurrent; // To maintain compatibility with existing frontend code

        const paymentsInThisSheet = memberApprovedPayments.filter(p =>
          p.capturedInMonth === sheet.month && p.capturedInYear === sheet.year
        );
        const paidInThisSheetAmount = paymentsInThisSheet.reduce((sum, p) => sum + Number(p.amount), 0);

        // Construct displayAmount
        let displayAmount = '';
        if (paidCurrent) {
          const capYear = currentPayment.capturedInYear ?? currentPayment.year;
          const capMonth = currentPayment.capturedInMonth ?? currentPayment.month;
          const isCapturedLater = capYear > sheet.year || (capYear === sheet.year && capMonth > sheet.month);
          const isCapturedEarlier = capYear < sheet.year || (capYear === sheet.year && capMonth < sheet.month);
          
          if (isCapturedLater) {
            displayAmount = `বকেয়া পরিশোধিত (${capMonth}/${capYear} শিটে)`;
          } else if (isCapturedEarlier) {
            displayAmount = 'অগ্রিম পরিশোধিত';
          } else if (paidDues.length > 0) {
            displayAmount = `${member.monthlyAmount} × ${paidDues.length} due + ${member.monthlyAmount} current = ${(paidDues.length + 1) * member.monthlyAmount} ৳`;
          } else {
            displayAmount = `${member.monthlyAmount} current = ${member.monthlyAmount} ৳`;
          }
        } else {
          if (unpaidDues.length > 0) {
            displayAmount = `${member.monthlyAmount} × ${unpaidDues.length} due + ${member.monthlyAmount} current due = ${(unpaidDues.length + 1) * member.monthlyAmount} ৳`;
          } else {
            displayAmount = `${member.monthlyAmount} ৳ due`;
          }
        }

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          monthlyAmount: member.monthlyAmount,
          status: paid ? 'paid' : 'due',
          payment: currentPayment || null,
          dueMonths: unpaidDues,
          paidDues: paidDues,
          totalDue: unpaidDues.length * member.monthlyAmount,
          displayAmount,
          paidInThisSheetAmount,
        };
      })
    );

    return {
      message: 'Sheet details fetched',
      data: {
        ...sheet,
        memberPayments: memberPaymentStatus,
        projectTransactions,
        salaries,
        expenses,
      },
    };
  }

  // Month/Year দিয়ে sheet দেখো
  async findByMonth(month: number, year: number) {
    const sheet = await this.sheetRepo.findOne({ where: { month, year } });
    if (!sheet) throw new NotFoundException(`Sheet for ${month}/${year} not found`);
    return this.findOne(sheet.id);
  }

  // Overall Fund Status
async getOverallStatus() {
  const settings = await this.settingsService.getSettings();
  const openingCashInHand = Number(settings.openingCashInHand || 0);
  const openingTotalProfit = Number(settings.openingTotalProfit || 0);

  // ০. Find all published sheets to get their month and year
  const publishedSheets = await this.sheetRepo.find({
    where: { status: SheetStatus.PUBLISHED }
  });
  const publishedKeys = new Set(publishedSheets.map(s => `${s.month}-${s.year}`));

  // ১. Approved member payments captured in published sheets
  const paymentsRes = await this.paymentsService.getAllPayments();
  const approvedPayments = (paymentsRes?.data || []).filter(p => 
    p.status === 'approved' &&
    p.capturedInMonth !== null &&
    p.capturedInYear !== null &&
    publishedKeys.has(`${p.capturedInMonth}-${p.capturedInYear}`)
  );
  const totalMemberIncome = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // ২. Project statistics captured in published sheets
  const projectsRes = await this.projectsService.findAll();
  const projects = projectsRes?.data || [];
  
  let totalProjectProfit = 0;
  let totalCapitalReturn = 0;
  let totalProjectExpense = 0;
  let totalInvested = 0;

  for (const p of projects) {
    const openingInvested = Number(p.openingInvested || 0);
    const txs = (p.transactions || []).filter(t => 
      t.capturedInMonth !== null && 
      t.capturedInYear !== null && 
      publishedKeys.has(`${t.capturedInMonth}-${t.capturedInYear}`)
    );

    const totalExpense = txs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalProfit = txs
      .filter(t => t.type === 'profit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const capitalReturn = txs
      .filter(t => t.type === 'capital_return')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    totalProjectProfit += totalProfit;
    totalCapitalReturn += capitalReturn;
    totalProjectExpense += totalExpense;

    const stillOutside = openingInvested + totalExpense - capitalReturn;
    if (stillOutside > 0) {
      totalInvested += stillOutside;
    }
  }

  // ৩. Salaries captured in published sheets
  const salariesRes = await this.salariesService.findAll();
  const approvedSalaries = (salariesRes?.data || []).filter(s =>
    s.capturedInMonth !== null &&
    s.capturedInYear !== null &&
    publishedKeys.has(`${s.capturedInMonth}-${s.capturedInYear}`)
  );
  const totalSalary = approvedSalaries.reduce((sum, s) => sum + Number(s.amount), 0);

  // ৪. General Expenses captured in published sheets
  const expenses = await this.expensesService.findAll();
  const approvedExpenses = (expenses || []).filter(e =>
    e.capturedInMonth !== null &&
    e.capturedInYear !== null &&
    publishedKeys.has(`${e.capturedInMonth}-${e.capturedInYear}`)
  );
  const totalGeneralExpense = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // ৫. Real-time calculations
  const cashInHand = openingCashInHand
    + totalMemberIncome
    + totalProjectProfit
    + totalCapitalReturn
    - totalSalary
    - totalProjectExpense
    - totalGeneralExpense;

  const totalProfit = openingTotalProfit + totalProjectProfit;
  const totalAsset = cashInHand + totalInvested;

  return {
    message: 'Overall fund status',
    data: {
      cashInHand: cashInHand.toFixed(2),
      totalInvested: totalInvested.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalAsset: totalAsset.toFixed(2),
    },
  };
}
  // Sheet delete করো (draft only)
async remove(id: number) {
  const sheet = await this.sheetRepo.findOne({
    where: { id },
  });

  if (!sheet) {
    throw new NotFoundException('Sheet not found');
  }

  if (sheet.status === SheetStatus.PUBLISHED) {
    throw new BadRequestException('Published sheet cannot be deleted');
  }

  await this.sheetRepo.delete(id);

  return {
    message: 'Sheet deleted',
    id,
  };
}
  // আগের মাসের sheet খোঁজো
  private async getPreviousSheet(month: number, year: number) {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }

    return this.sheetRepo.findOne({
      where: { month: prevMonth, year: prevYear, status: SheetStatus.PUBLISHED },
    });
  }
  async resetAll() {
  await this.sheetRepo.query('DELETE FROM monthly_sheet');
}
}