import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PaymentReminderService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('5 10 * * *')
  async sendMonthlyPaymentReminders() {
    const now = new Date();
    const currentDay = now.getDate();
    if (currentDay < 10) {
      return;
    }

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const users = await this.usersService.findAll();

    for (const user of users) {
      if (Number(user.monthlyAmount) <= 0) {
        continue;
      }

      const existingPayment = await this.paymentRepo.findOne({
        where: [
          { userId: user.id, month: currentMonth, year: currentYear, status: PaymentStatus.APPROVED },
          { userId: user.id, month: currentMonth, year: currentYear, status: PaymentStatus.PENDING },
        ],
      });

      if (existingPayment) {
        continue;
      }

      const message = `${currentMonth}/${currentYear} মাসের পেমেন্ট এখনও জমা হয়নি। অনুগ্রহ করে দ্রুত জমা দিন।`;
      await this.notificationsService.createIfNotExists(user.id, message);
    }
  }
}
