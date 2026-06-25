import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Payment } from '../payments/entities/payment.entity';
import { MemberOpeningBalance } from '../payments/entities/member-opening-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment, MemberOpeningBalance])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}