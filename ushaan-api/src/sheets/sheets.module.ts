import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlySheet } from './entities/monthly-sheet.entity';
import { SheetsService } from './sheets.service';
import { SheetsController } from './sheets.controller';
import { PaymentsModule } from '../payments/payments.module';
import { ProjectsModule } from '../projects/projects.module';
import { SalariesModule } from '../salaries/salaries.module';
import { UsersModule } from 'src/users/users.module';
import { SettingsModule } from 'src/settings/settings.module';
import { ExpensesModule } from 'src/expenses/expenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlySheet]),
    PaymentsModule,
    ProjectsModule,
    SalariesModule,
    UsersModule,  
    SettingsModule,
    ExpensesModule, // ✅ নতুন - ExpenseService ব্যবহার করার জন্য
  ],
  controllers: [SheetsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}