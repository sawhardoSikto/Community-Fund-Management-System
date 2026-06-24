import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlySheet } from './entities/monthly-sheet.entity';
import { SheetsService } from './sheets.service';
import { SheetsController } from './sheets.controller';
import { PaymentsModule } from '../payments/payments.module';
import { ProjectsModule } from '../projects/projects.module';
import { SalariesModule } from '../salaries/salaries.module';
import { UsersModule } from 'src/users/users.module';
import { SettingsModule } from 'src/settings/settings.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlySheet]),
    forwardRef(() => PaymentsModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => SalariesModule),
    UsersModule,  
    SettingsModule,
    forwardRef(() => ExpensesModule), // ✅ নতুন - ExpenseService ব্যবহার করার জন্য
    NotificationsModule, // ✅ নতুন - NotificationsService ব্যবহার করার জন্য
  ],
  controllers: [SheetsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}