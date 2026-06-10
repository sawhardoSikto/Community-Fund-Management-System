import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { OpeningBalanceDto } from './dto/opening-balance.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepo: Repository<Settings>,
  ) {}

  // Opening balance set করো
  async setOpeningBalance(dto: OpeningBalanceDto, adminId: number) {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });

    if (settings) {
      // update করো
      await this.settingsRepo.update(1, { ...dto, setBy: adminId });
    } else {
      // নতুন বানাও
      settings = this.settingsRepo.create({ ...dto, setBy: adminId });
      await this.settingsRepo.save(settings);
    }

    return { message: 'Opening balance set successfully', data: await this.getSettings() };
  }

  // Settings দেখো
  async getSettings() {
    const settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      return {
        openingCashInHand: 0,
        openingTotalInvested: 0,
        openingTotalProfit: 0,
        openingMonth: 1,
        openingYear: new Date().getFullYear(),
      };
    }
    return settings;
  }
  async resetSettings() {
  await this.settingsRepo.query('DELETE FROM settings');
}
}