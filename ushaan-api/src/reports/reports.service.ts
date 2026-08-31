import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { ProjectTransaction, TransactionType } from '../projects/entities/project-transaction.entity';
import { Salary } from '../salaries/entities/salary.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(ProjectTransaction) private ptxRepo: Repository<ProjectTransaction>,
    @InjectRepository(Salary) private salaryRepo: Repository<Salary>,
    private settingsService: SettingsService,
  ) {}

  async getLedger(startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const settings = await this.settingsService.getSettings();
    let openingBalance = Number(settings.openingCashInHand || 0);

    // Fetch all records
    const allPayments = await this.paymentRepo.find({ where: { status: PaymentStatus.APPROVED } });
    const allExpenses = await this.expenseRepo.find();
    const allPtx = await this.ptxRepo.find();
    const allSalaries = await this.salaryRepo.find();

    // Opening Balance Calculation (Before startDate)
    const incomesBefore = allPayments.filter(p => this.getPaymentDate(p) < startDate);
    const expensesBefore = allExpenses.filter(e => new Date(e.date) < startDate);
    const ptxIncomeBefore = allPtx.filter(p => (p.type === TransactionType.PROFIT || p.type === TransactionType.CAPITAL_RETURN) && new Date(p.date) < startDate);
    const ptxExpenseBefore = allPtx.filter(p => p.type === TransactionType.EXPENSE && new Date(p.date) < startDate);
    const salariesBefore = allSalaries.filter(s => new Date(s.createdAt) < startDate);

    openingBalance += incomesBefore.reduce((sum, p) => sum + Number(p.amount), 0);
    openingBalance += ptxIncomeBefore.reduce((sum, p) => sum + Number(p.amount), 0);
    openingBalance -= expensesBefore.reduce((sum, e) => sum + Number(e.amount), 0);
    openingBalance -= ptxExpenseBefore.reduce((sum, p) => sum + Number(p.amount), 0);
    openingBalance -= salariesBefore.reduce((sum, s) => sum + Number(s.amount), 0);

    // Current Period Calculation (Between startDate and endDate)
    const incomesPeriod = allPayments.filter(p => {
      const d = this.getPaymentDate(p);
      return d >= startDate && d <= endDate;
    });
    const expensesPeriod = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
    const ptxPeriod = allPtx.filter(p => {
      const d = new Date(p.date);
      return d >= startDate && d <= endDate;
    });
    const salariesPeriod = allSalaries.filter(s => {
      const d = new Date(s.createdAt);
      return d >= startDate && d <= endDate;
    });

    // Group Incomes
    const groupedIncomes: { label: string; amount: number }[] = [];
    let monthlyIncome = 0;
    let fineIncome = 0;

    for (const p of incomesPeriod) {
      const coveredMonths = p.coveredMonths ? JSON.parse(p.coveredMonths) : [];
      const monthlyAmount = p.user?.monthlyAmount || 200;
      const monthlyTotal = coveredMonths.length * monthlyAmount;
      const finePart = Number(p.amount) - monthlyTotal;

      monthlyIncome += monthlyTotal;
      if (finePart > 0) {
        fineIncome += finePart;
      }
    }

    if (monthlyIncome > 0) groupedIncomes.push({ label: 'Service Charge / Subscription', amount: monthlyIncome });
    if (fineIncome > 0) groupedIncomes.push({ label: 'Penalty / Fines', amount: fineIncome });

    const projIncome = ptxPeriod.filter(p => p.type === TransactionType.PROFIT || p.type === TransactionType.CAPITAL_RETURN).reduce((sum, p) => sum + Number(p.amount), 0);
    if (projIncome > 0) groupedIncomes.push({ label: 'Project Returns & Profit', amount: projIncome });

    const totalIncome = groupedIncomes.reduce((sum, i) => sum + i.amount, 0);

    // Group Expenses
    const groupedExpenses: { label: string; amount: number }[] = [];
    const groupedExpMap: { [key: string]: number } = {};
    expensesPeriod.forEach(e => {
      const cat = e.category || 'Other';
      groupedExpMap[cat] = (groupedExpMap[cat] || 0) + Number(e.amount);
    });
    for (const [cat, amt] of Object.entries(groupedExpMap)) {
      groupedExpenses.push({ label: `Expense: ${cat}`, amount: amt });
    }

    const projExpense = ptxPeriod.filter(p => p.type === TransactionType.EXPENSE).reduce((sum, p) => sum + Number(p.amount), 0);
    if (projExpense > 0) groupedExpenses.push({ label: 'Project Investment', amount: projExpense });

    const totalSalary = salariesPeriod.reduce((sum, s) => sum + Number(s.amount), 0);
    if (totalSalary > 0) groupedExpenses.push({ label: 'Salary', amount: totalSalary });

    const totalExpense = groupedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const closingBalance = openingBalance + totalIncome - totalExpense;

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      openingBalance,
      incomes: groupedIncomes,
      expenses: groupedExpenses,
      totalIncome,
      totalExpense,
      closingBalance
    };
  }

  private getPaymentDate(payment: Payment): Date {
    if (payment.paymentDate) return new Date(payment.paymentDate);
    if (payment.approvedAt) return new Date(payment.approvedAt);
    return new Date(payment.createdAt);
  }
}
