import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { MonthlySheet } from 'src/sheets/entities/monthly-sheet.entity';
import { SheetsModule } from '../sheets/sheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, MonthlySheet]),
    forwardRef(() => SheetsModule),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}