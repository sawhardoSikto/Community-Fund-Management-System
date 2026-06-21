import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salary } from './entities/salary.entity';
import { SalariesService } from './salaries.service';
import { SalariesController } from './salaries.controller';
import { MonthlySheet } from 'src/sheets/entities/monthly-sheet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Salary, MonthlySheet])],
  controllers: [SalariesController],
  providers: [SalariesService],
  exports: [SalariesService],
})
export class SalariesModule {}