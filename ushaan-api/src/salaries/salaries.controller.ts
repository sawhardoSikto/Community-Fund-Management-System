import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('salaries')
@UseGuards(RolesGuard)
export class SalariesController {
  constructor(private salariesService: SalariesService) {}

  // Accountant — salary add করো
  @Post()
  @Roles('accountant', 'admin')
  create(@Body() dto: CreateSalaryDto) {
    return this.salariesService.create(dto);
  }

  // সব salary দেখো
  @Get()
  @Roles('accountant', 'admin', 'general_secretary')
  findAll() {
    return this.salariesService.findAll();
  }

  // একটা মাসের salary দেখো
  @Get('by-month')
  @Roles('accountant', 'admin', 'general_secretary')
  getByMonth(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.salariesService.getByMonth(month, year);
  }

  // Salary delete করো
  @Delete(':id')
  @Roles('accountant', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salariesService.remove(id);
  }
  @Delete('reset')
@Roles('admin')
async reset() {
  await this.salariesService.resetAll();
  return { message: 'All salaries deleted' };
}
}