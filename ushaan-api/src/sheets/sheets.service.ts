import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlySheet, SheetStatus } from './entities/monthly-sheet.entity';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { PaymentsService } from '../payments/payments.service';
import { ProjectsService } from '../projects/projects.service';
import { SalariesService } from '../salaries/salaries.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SheetsService {
  constructor(
    @InjectRepository(MonthlySheet)
    private sheetRepo: Repository<MonthlySheet>,
    private paymentsService: PaymentsService,
    private projectsService: ProjectsService,
    private salariesService: SalariesService,
    private usersService: UsersService,
  ) {}

  // Sheet generate করো (draft)
  async generateSheet(dto: CreateSheetDto, accountantId: number) {
    // ১. এই মাসের sheet already আছে কিনা check
    const existing = await this.sheetRepo.findOne({
      where: { month: dto.month, year: dto.year },
    });
    if (existing) throw new BadRequestException(
      `Sheet for ${dto.month}/${dto.year} already exists`
    );

    // ২. এই মাসের approved payments
    const payments = await this.paymentsService.getApprovedPaymentsByMonth(
      dto.month, dto.year
    );
    const totalMemberIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // ৩. এই মাসের project income
    const projectTransactions = await this.projectsService.getProjectIncomeByMonth(
      dto.month, dto.year
    );
    const totalProjectIncome = projectTransactions.reduce(
      (sum, t) => sum + Number(t.amount), 0
    );

    // ৪. এই মাসের salary
    const salaries = await this.salariesService.getSalariesByMonth(dto.month, dto.year);
    const totalSalary = salaries.reduce((sum, s) => sum + Number(s.amount), 0);

    // ৫. আগের মাসের balance নাও
    const previousSheet = await this.getPreviousSheet(dto.month, dto.year);
    const previousBalance = previousSheet ? Number(previousSheet.cashInHand) : 0;

    // ৬. Cash in Hand calculate করো
    const cashInHand = previousBalance + totalMemberIncome + totalProjectIncome - totalSalary;

    // ৭. Total invested (active projects এ বাইরে আছে)
    const totalInvested = await this.projectsService.getOverallInvestedAmount();

    // ৮. Total asset
    const totalAsset = cashInHand + totalInvested;

    // ৯. Sheet বানাও
    const sheet = this.sheetRepo.create({
      month: dto.month,
      year: dto.year,
      totalMemberIncome,
      totalProjectIncome,
      totalSalary,
      previousBalance,
      cashInHand,
      totalInvested,
      totalAsset,
      status: SheetStatus.DRAFT,
      publishedBy: accountantId,
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
    const payments = await this.paymentsService.getApprovedPaymentsByMonth(
      sheet.month, sheet.year
    );
    const projectTransactions = await this.projectsService.getProjectIncomeByMonth(
      sheet.month, sheet.year
    );
    const salaries = await this.salariesService.getSalariesByMonth(
      sheet.month, sheet.year
    );

    // সব members এর payment status
    const allUsers = await this.usersService.findAll();
    const members = allUsers.filter(u => u.role === 'member');
    const paidUserIds = payments.map(p => p.userId);

    const memberPaymentStatus = members.map(member => ({
      id: member.id,
      name: member.name,
      monthlyAmount: member.monthlyAmount,
      status: paidUserIds.includes(member.id) ? 'paid' : 'due',
      payment: payments.find(p => p.userId === member.id) || null,
    }));

    return {
      message: 'Sheet fetched',
      data: {
        ...sheet,
        memberPayments: memberPaymentStatus,
        projectTransactions,
        salaries,
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
    const latestSheet = await this.sheetRepo.findOne({
      where: { status: SheetStatus.PUBLISHED },
      order: { year: 'DESC', month: 'DESC' },
    });

    const totalInvested = await this.projectsService.getOverallInvestedAmount();

    return {
      message: 'Overall fund status',
      data: {
        cashInHand: latestSheet ? Number(latestSheet.cashInHand) : 0,
        totalInvested,
        totalAsset: latestSheet
          ? Number(latestSheet.cashInHand) + totalInvested
          : totalInvested,
        lastUpdated: latestSheet
          ? `${latestSheet.month}/${latestSheet.year}`
          : 'No sheet published yet',
      },
    };
  }

  // Sheet delete করো (draft only)
  async remove(id: number) {
    const sheet = await this.sheetRepo.findOne({ where: { id } });
    if (!sheet) throw new NotFoundException('Sheet not found');
    if (sheet.status === SheetStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete published sheet');
    }
    await this.sheetRepo.delete(id);
    return { message: 'Sheet deleted', id };
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
}