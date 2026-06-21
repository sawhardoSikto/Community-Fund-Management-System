import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salary } from './entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { MonthlySheet, SheetStatus } from 'src/sheets/entities/monthly-sheet.entity';

@Injectable()
export class SalariesService implements OnModuleInit {
  constructor(
    @InjectRepository(Salary)
    private salaryRepo: Repository<Salary>,
    @InjectRepository(MonthlySheet)
    private sheetRepo: Repository<MonthlySheet>,
  ) {}

  async onModuleInit() {
    try {
      await this.salaryRepo.query(
        `UPDATE salary SET "capturedInMonth" = month, "capturedInYear" = year WHERE "capturedInMonth" IS NULL`
      );
    } catch (err) {
      console.error('Failed to migrate existing salaries capturedInMonth/capturedInYear', err);
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

  // Accountant — salary add করো
  async create(dto: CreateSalaryDto) {
    // একই মাসে একই user এর salary আছে কিনা check
    const existing = await this.salaryRepo.findOne({
      where: { userId: dto.userId, month: dto.month, year: dto.year },
    });
    if (existing) throw new BadRequestException(
      `Salary for this user already added for ${dto.month}/${dto.year}`
    );

    const capture = await this.getCaptureMonthAndYear(dto.month, dto.year);

    const salary = this.salaryRepo.create({
      ...dto,
      capturedInMonth: capture.month,
      capturedInYear: capture.year,
    });
    await this.salaryRepo.save(salary);
    return { message: 'Salary added', data: salary };
  }

  // একটা মাসের সব salary দেখো
  async getByMonth(month: number, year: number) {
    const salaries = await this.salaryRepo.find({
      where: { month, year },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    const total = salaries.reduce((sum, s) => sum + Number(s.amount), 0);
    return { message: 'Salaries fetched', count: salaries.length, total, data: salaries };
  }

  // সব salary দেখো
  async findAll() {
    const salaries = await this.salaryRepo.find({
      relations: { user: true },
      order: { year: 'DESC', month: 'DESC' },
    });
    return { message: 'All salaries fetched', count: salaries.length, data: salaries };
  }

  // Salary delete করো
  async remove(id: number) {
    const salary = await this.salaryRepo.findOne({ where: { id } });
    if (!salary) throw new NotFoundException('Salary not found');
    await this.salaryRepo.delete(id);
    return { message: 'Salary deleted', id };
  }

  // Sheet generate এর জন্য
  async getSalariesByMonth(month: number, year: number): Promise<Salary[]> {
    return this.salaryRepo.find({
      where: { capturedInMonth: month, capturedInYear: year },
      relations: { user: true },
    });
  }

  // Default salary বানাও (admin, secretary, accountant)
  async createDefaultSalaries(month: number, year: number, users: any[]) {
    const defaultAmounts: Record<string, number> = {
      admin: 30,
      general_secretary: 20,
      accountant: 50,
    };

    const created: Salary[] = [];
    for (const user of users) {
      if (defaultAmounts[user.role]) {
        const existing = await this.salaryRepo.findOne({
          where: { userId: user.id, month, year },
        });
        if (!existing) {
          const capture = await this.getCaptureMonthAndYear(month, year);
          const salary = this.salaryRepo.create({
            userId: user.id,
            month,
            year,
            amount: defaultAmounts[user.role],
            role: user.role,
            capturedInMonth: capture.month,
            capturedInYear: capture.year,
          });
          await this.salaryRepo.save(salary);
          created.push(salary);
        }
      }
    }
    return created;
  }
  async resetAll() {
    await this.salaryRepo.query('DELETE FROM salary');
  }
}