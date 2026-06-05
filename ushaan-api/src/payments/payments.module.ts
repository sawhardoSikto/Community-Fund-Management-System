import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity'; // ✅ শুধু Payment
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { UsersModule } from 'src/users/users.module';
import { MemberOpeningBalance } from './entities/member-opening-balance.entity'; // ✅ MemberOpeningBalance entity
@Module({
  imports: [TypeOrmModule.forFeature([Payment, MemberOpeningBalance]), UsersModule], // ✅ শুধু Payment, আর usersModule
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService], // ✅ export আছে
})
export class PaymentsModule {} // ✅ export class আছে