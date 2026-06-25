import { Controller, Get, Post, Delete, Body, Param, Query, Request, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('expenses')
@UseGuards(RolesGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  // ✅ Accountant/Admin — expense add করো
  @Post()
  @Roles('accountant', 'admin')
  create(@Body() dto: CreateExpenseDto, @Request() req) {
    return this.expensesService.create(dto, req.user.id);
  }

  // ✅ সবাই দেখতে পারবে
  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  // ✅ Month/Year দিয়ে filter
  @Get('by-month')
  findByMonth(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.expensesService.findByMonth(month, year);
  }

  // ✅ Delete
  @Delete(':id')
  @Roles('accountant', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expensesService.remove(id);
  }

  @Delete('reset/all')
  @Roles('admin', 'accountant')
  resetAll() {
    return this.expensesService.resetAll();
  }
}