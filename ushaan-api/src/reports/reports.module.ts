import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Payment } from '../payments/entities/payment.entity';
import { Fine } from '../fines/entities/fine.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { ProjectTransaction } from '../projects/entities/project-transaction.entity';
import { Salary } from '../salaries/entities/salary.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Fine, Expense, ProjectTransaction, Salary]),
    SettingsModule,
  ],
  providers: [ReportsService],
  controllers: [ReportsController]
})
export class ReportsModule {}
