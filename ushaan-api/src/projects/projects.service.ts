import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectTransaction, TransactionType } from './entities/project-transaction.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SheetsService } from '../sheets/sheets.service';
import { SettingsService } from 'src/settings/settings.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from 'src/notifications/notifications.service';


@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(ProjectTransaction)
    private transactionRepo: Repository<ProjectTransaction>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  // সব project দেখো
  async findAll() {
    const projects = await this.projectRepo.find({
      relations: { transactions: true },
      order: { createdAt: 'DESC' },
    });

    // প্রতিটা project এর summary calculate করো
    const data = projects.map(p => this.calculateProjectSummary(p));
    return { message: 'Projects fetched', count: projects.length, data };
  }

  // একটা project দেখো
  async findOne(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: { transactions: true },
    });
    if (!project) throw new NotFoundException(`Project with id ${id} not found`);
    return { message: 'Project fetched', data: this.calculateProjectSummary(project) };
  }

  // Project বানাও
  async create(dto: CreateProjectDto) {
    const project = this.projectRepo.create(dto);
    await this.projectRepo.save(project);
    const users = await this.usersService.findAll();

for (const user of users) {
  await this.notificationsService.create(
    user.id,
    `নতুন প্রকল্প যুক্ত হয়েছে: ${project.name}`,
  );
}
    return { message: 'Project created', data: project };
  }

  // Project update করো
  async update(id: number, dto: UpdateProjectDto) {
    await this.findOne(id);
    await this.projectRepo.update(id, dto);
    return this.findOne(id);
  }

  // Project delete করো
  async remove(id: number) {
    await this.findOne(id);
    await this.projectRepo.delete(id);
    return { message: 'Project deleted', id };
  }

  // Transaction add করো
  async addTransaction(projectId: number, dto: CreateTransactionDto) {
    const projectData = await this.findOne(projectId);
    const project = projectData.data;

    const transaction = this.transactionRepo.create({
      projectId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      date: new Date(dto.date),
    });
    if (dto.type === TransactionType.PROFIT) {
  const users = await this.usersService.findAll();

  for (const user of users) {
    await this.notificationsService.create(
      user.id,
      `${project.name} প্রকল্পে নতুন লাভ যুক্ত হয়েছে।`,
    );
  }
}
    await this.transactionRepo.save(transaction);

    // totalInvested update করো
    if (dto.type === TransactionType.EXPENSE) {
      await this.projectRepo.update(projectId, {
        totalInvested: Number(project.totalInvested) + dto.amount,
      });
    }

    return { message: 'Transaction added', data: transaction };
  }

  // Project summary calculate করো
  private calculateProjectSummary(project: Project) {
    const transactions = project.transactions || [];

    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalProfit = transactions
      .filter(t => t.type === TransactionType.PROFIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const capitalReturn = transactions
      .filter(t => t.type === TransactionType.CAPITAL_RETURN)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalReceived = totalProfit + capitalReturn;
// ✅ openingInvested যোগ করো
  const stillOutside = Number(project.openingInvested) + totalExpense - capitalReturn;

    return {
      ...project,
      summary: {
        totalExpense,
        totalProfit,
        capitalReturn,
        totalReceived,
        stillOutside: stillOutside > 0 ? stillOutside : 0,
      },
    };
  }

  // Sheet generate এর জন্য — একটা মাসের project income
async getProjectIncomeByMonth(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.transactionRepo
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.project', 'project')
    .where('tx.date >= :startDate', { startDate })
    .andWhere('tx.date <= :endDate', { endDate })
    .andWhere('tx.type = :type', {
      type: TransactionType.PROFIT,
    })
    .getMany();
}
async getCapitalReturnByMonth(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.transactionRepo
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.project', 'project')
    .where('tx.date >= :startDate', { startDate })
    .andWhere('tx.date <= :endDate', { endDate })
    .andWhere('tx.type = :type', {
      type: TransactionType.CAPITAL_RETURN,
    })
    .getMany();
}

  // Overall fund status এর জন্য
  async getOverallInvestedAmount() {
  // ✅ সব projects (active + completed)
  const projects = await this.projectRepo.find({
    relations: { transactions: true },
  });

  let totalStillOutside = 0;
  for (const project of projects) {
    const transactions = project.transactions || [];

    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const capitalReturn = transactions
      .filter(t => t.type === TransactionType.CAPITAL_RETURN)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // ✅ এখনো বাইরে = invest - return
    const stillOutside = Number(project.openingInvested) + totalExpense - capitalReturn;
    if (stillOutside > 0) totalStillOutside += stillOutside;
  }

  return totalStillOutside;
}
// এই মাসের project expense
async getProjectExpenseByMonth(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.transactionRepo
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.project', 'project')
    .where('tx.date >= :startDate', { startDate })
    .andWhere('tx.date <= :endDate', { endDate })
    .andWhere('tx.type = :type', { type: TransactionType.EXPENSE })
    .getMany();
}
}