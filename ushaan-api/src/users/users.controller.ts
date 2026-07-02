import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/multer.config';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ✅ Profile update endpoint for own profile (any authenticated user)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('photo', multerConfig))
  async updateProfile(
    @Request() req,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user.id;
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.nid !== undefined) updateData.nid = body.nid;
    
    if (file) {
      updateData.photoUrl = `/uploads/${file.filename}`;
    }
    
    const updatedUser = await this.usersService.update(userId, updateData);
    
    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  // Admin & Members — সব users দেখো
  @Get()
  @Roles('admin', 'accountant', 'general_secretary', 'member')
  findAll() {
    return this.usersService.findAll();
  }

  // Admin — একজন user দেখো
  @Get(':id')
  @Roles('admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  // Admin — user update করো
  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  // Admin — user delete করো
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}