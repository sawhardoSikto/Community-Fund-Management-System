import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) {}

  async create(dto: CreateExpenseDto, userId: number) {
    const expense = this.expenseRepo.create({
      ...dto,
      date: new Date(dto.date),
      addedBy: userId,
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
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const expenses = await this.expenseRepo.find({
      where: { date: Between(startDate, endDate) },
    });
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  // Reset
  async resetAll() {
    await this.expenseRepo.query('DELETE FROM expense');
  }
}