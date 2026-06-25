import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('sheets')
@UseGuards(RolesGuard)
export class SheetsController {
  constructor(private sheetsService: SheetsService) {}

  // ✅ Accountant — sheet generate করো
  @Post('generate')
  @Roles('accountant', 'admin')
  generateSheet(@Body() dto: CreateSheetDto, @Request() req) {
    return this.sheetsService.generateSheet(dto, req.user.id);
  }

  // ✅ Accountant — sheet publish করো
  @Patch(':id/publish')
  @Roles('accountant', 'admin')
  publishSheet(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.sheetsService.publishSheet(id, req.user.id);
  }

  // ✅ সবাই — সব sheets দেখো
  @Get()
  findAll() {
    return this.sheetsService.findAll();
  }

  // ✅ সবাই — overall fund status
  @Get('overall-status')
  getOverallStatus() {
    return this.sheetsService.getOverallStatus();
  }

  // ✅ সবাই — month/year দিয়ে sheet দেখো
  @Get('by-month')
  findByMonth(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.sheetsService.findByMonth(month, year);
  }

  // ✅ সবাই — একটা sheet দেখো
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sheetsService.findOne(id);
  }

  // ✅ Accountant — draft sheet delete করো
  @Delete('reset')
  @Roles('admin', 'accountant')
  @UseGuards(RolesGuard)
  async reset() {
    await this.sheetsService.resetAll();
    return { message: 'All sheets deleted' };
  }
  @Delete(':id')
  @Roles('accountant', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sheetsService.remove(id);
  }
}