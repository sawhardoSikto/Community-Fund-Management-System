import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { IsPublic } from '../auth/public.decorator';

@Controller('projects')
@UseGuards(RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // ✅ সবাই দেখতে পারবে
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  // ✅ সবাই দেখতে পারবে
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  // ✅ শুধু admin
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  // ✅ শুধু accountant/admin
  @Patch(':id')
  @Roles('accountant', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  // ✅ শুধু admin
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  // ✅ Transaction add করো
  @Post(':id/transactions')
  @Roles('accountant', 'admin')
  addTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.projectsService.addTransaction(id, dto);
  }
}