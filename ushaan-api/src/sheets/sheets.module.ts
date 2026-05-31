import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlySheet } from './entities/monthly-sheet.entity';
import { SheetsService } from './sheets.service';
import { SheetsController } from './sheets.controller';
import { PaymentsModule } from '../payments/payments.module';
import { ProjectsModule } from '../projects/projects.module';
import { SalariesModule } from '../salaries/salaries.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlySheet]),
    PaymentsModule,
    ProjectsModule,
    SalariesModule,
  ],
  controllers: [SheetsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}