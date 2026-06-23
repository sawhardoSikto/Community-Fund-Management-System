import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('notices')
@UseGuards(RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  findAll() {
    return this.noticesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.findOne(id);
  }

  @Post()
  @Roles('admin', 'accountant', 'general_secretary')
  create(@Body() dto: CreateNoticeDto, @Request() req) {
    return this.noticesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('admin', 'accountant', 'general_secretary')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoticeDto) {
    return this.noticesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'accountant', 'general_secretary')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.remove(id);
  }
}
