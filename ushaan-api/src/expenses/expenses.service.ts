import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { MonthlySheet, SheetStatus } from 'src/sheets/entities/monthly-sheet.entity';

@Injectable()
export class ExpensesService implements OnModuleInit {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
    @InjectRepository(MonthlySheet)
    private sheetRepo: Repository<MonthlySheet>,
  ) {}

  async onModuleInit() {
    try {
      // Migrate existing expenses: calculate target month/year from date column
      await this.expenseRepo.query(
        `UPDATE expense SET "capturedInMonth" = EXTRACT(MONTH FROM date), "capturedInYear" = EXTRACT(YEAR FROM date) WHERE "capturedInMonth" IS NULL`
      );
    } catch (err) {
      console.error('Failed to migrate existing expenses capturedInMonth/capturedInYear', err);
    }
  }

  async getCaptureMonthAndYear(targetMonth: number, targetYear: number): Promise<{ month: number; year: number }> {
    const targetSheet = await this.sheetRepo.findOne({
      where: { month: targetMonth, year: targetYear, status: SheetStatus.PUBLISHED }
    });
    if (!targetSheet) {
      return { month: targetMonth, year: targetYear };
    }
    const latestPublishedSheet = await this.sheetRepo.findOne({
      where: { status: SheetStatus.PUBLISHED },
      order: { year: 'DESC', month: 'DESC' }
    });
    if (!latestPublishedSheet) {
      return { month: targetMonth, year: targetYear };
    }
    let nextMonth = latestPublishedSheet.month + 1;
    let nextYear = latestPublishedSheet.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    return { month: nextMonth, year: nextYear };
  }

  async create(dto: CreateExpenseDto, userId: number) {
    const expDate = new Date(dto.date);
    const targetMonth = expDate.getMonth() + 1;
    const targetYear = expDate.getFullYear();

    const capture = await this.getCaptureMonthAndYear(targetMonth, targetYear);

    const expense = this.expenseRepo.create({
      ...dto,
      date: expDate,
      addedBy: userId,
      capturedInMonth: capture.month,
      capturedInYear: capture.year,
    });
    await this.expenseRepo.save(expense);
    return { message: 'Expense added', data: expense };
  }

  async findAll() {
    return this.expenseRepo.find({
      relations: { user: true },
      order: { date: 'DESC' },
    });
  }

  async findByMonth(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const expenses = await this.expenseRepo.find({
      where: { date: Between(startDate, endDate) },
      relations: { user: true },
      order: { date: 'DESC' },
    });
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { message: 'Expenses fetched', count: expenses.length, total, data: expenses };
  }

  async remove(id: number) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.expenseRepo.delete(id);
    return { message: 'Expense deleted', id };
  }

  // Sheet generate এর জন্য
  async getTotalExpenseByMonth(month: number, year: number): Promise<number> {
    const expenses = await this.expenseRepo.find({
      where: { capturedInMonth: month, capturedInYear: year },
    });
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  async getExpensesByMonthCaptured(month: number, year: number): Promise<Expense[]> {
    return this.expenseRepo.find({
      where: { capturedInMonth: month, capturedInYear: year },
      relations: { user: true },
      order: { date: 'DESC' },
    });
  }

  // Reset
  async resetAll() {
    await this.expenseRepo.query('DELETE FROM expense');
  }
}