import { Controller, Get, Post, Body, Request, UseGuards, Delete } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { OpeningBalanceDto } from './dto/opening-balance.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Post('opening-balance')
  @Roles('admin')
  setOpeningBalance(@Body() dto: OpeningBalanceDto, @Request() req) {
    return this.settingsService.setOpeningBalance(dto, req.user.id);
  }
  @Delete('reset')
@Roles('admin')
async reset() {
  await this.settingsService.resetSettings();
  return { message: 'Settings reset' };
}
}