import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { FinesService } from './fines.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('fines')
@UseGuards(RolesGuard)
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateFineDto) {
    return this.finesService.create(dto);
  }

  @Get()
  @Roles('admin', 'accountant', 'general_secretary')
  findAll() {
    return this.finesService.findAll();
  }

  @Get('my/pending')
  getMyPending(@Request() req) {
    return this.finesService.findUserPending(req.user.id);
  }

  @Get('my')
  getMyAll(@Request() req) {
    return this.finesService.findUserAll(req.user.id);
  }

  @Get('user/:userId')
  @Roles('admin', 'accountant', 'general_secretary')
  getUserFines(@Param('userId', ParseIntPipe) userId: number) {
    return this.finesService.findUserAll(userId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finesService.remove(id);
  }
}
