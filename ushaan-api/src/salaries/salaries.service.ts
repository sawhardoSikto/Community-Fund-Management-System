import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salary } from './entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';

@Injectable()
export class SalariesService {
  constructor(
    @InjectRepository(Salary)
    private salaryRepo: Repository<Salary>,
  ) {}

  // Accountant — salary add করো
  async create(dto: CreateSalaryDto) {
    // একই মাসে একই user এর salary আছে কিনা check
    const existing = await this.salaryRepo.findOne({
      where: { userId: dto.userId, month: dto.month, year: dto.year },
    });
    if (existing) throw new BadRequestException(
      `Salary for this user already added for ${dto.month}/${dto.year}`
    );

    const salary = this.salaryRepo.create(dto);
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
      where: { month, year },
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
          const salary = this.salaryRepo.create({
            userId: user.id,
            month,
            year,
            amount: defaultAmounts[user.role],
            role: user.role,
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