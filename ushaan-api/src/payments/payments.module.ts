import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity'; // ✅ শুধু Payment
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { UsersModule } from 'src/users/users.module';
import { MemberOpeningBalance } from './entities/member-opening-balance.entity'; // ✅ MemberOpeningBalance entity
import { MonthlySheet } from 'src/sheets/entities/monthly-sheet.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PaymentReminderService } from './payment-reminder.service';
import { SheetsModule } from 'src/sheets/sheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, MemberOpeningBalance, MonthlySheet]), 
    UsersModule, 
    NotificationsModule,
    forwardRef(() => SheetsModule),
  ], 
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentReminderService],
  exports: [PaymentsService], // ✅ export আছে
})
export class PaymentsModule {} // ✅ export class আছে