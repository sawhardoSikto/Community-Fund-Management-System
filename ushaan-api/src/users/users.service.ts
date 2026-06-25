import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { MemberOpeningBalance } from '../payments/entities/member-opening-balance.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(MemberOpeningBalance)
    private openingBalanceRepo: Repository<MemberOpeningBalance>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    return this.userRepo.findOne({ where: { email: cleanEmail } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async calculateDueAmount(user: User): Promise<number> {
    if (!user || !user.isApproved || !user.isVerified) {
      return 0;
    }

    const userId = user.id;
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { year: 'ASC', month: 'ASC' },
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const opening = await this.openingBalanceRepo.findOne({ where: { userId } });
    let startMonth = new Date(user.createdAt).getMonth() + 1;
    let startYear = new Date(user.createdAt).getFullYear();
    if (opening) {
      let nextMonth = Number(opening.upToMonth) + 1;
      let nextYear = Number(opening.upToYear);
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      startMonth = nextMonth;
      startYear = nextYear;
    }

    const dueList: { month: number; year: number }[] = [];
    let checkMonth = startMonth;
    let checkYear = startYear;

    while (
      checkYear < currentYear ||
      (checkYear === currentYear && checkMonth <= currentMonth)
    ) {
      const paid = payments.find((p) => {
        if (p.status !== PaymentStatus.APPROVED && p.status !== PaymentStatus.PENDING) {
          return false;
        }
        if (p.month === checkMonth && p.year === checkYear) {
          return true;
        }
        if (!p.coveredMonths) {
          return false;
        }
        try {
          const coveredMonths = JSON.parse(p.coveredMonths);
          return coveredMonths.some((covered) => covered.month === checkMonth && covered.year === checkYear);
        } catch {
          return false;
        }
      });

      if (!paid) {
        dueList.push({ month: checkMonth, year: checkYear });
      }

      checkMonth++;
      if (checkMonth > 12) {
        checkMonth = 1;
        checkYear++;
      }
    }

    return dueList.length * Number(user.monthlyAmount || 0);
  }

  async findAll() {
    const users = await this.userRepo.find({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        monthlyAmount: true,
        nid: true,
        photoUrl: true,
        isVerified: true,
        isApproved: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });

    const usersWithDue = await Promise.all(
      users.map(async (user) => {
        const dueAmount = await this.calculateDueAmount(user);
        return {
          ...user,
          dueAmount,
        };
      }),
    );

    return usersWithDue;
  }

  async countUsers(): Promise<number> {
    return this.userRepo.count();
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async saveOtp(userId: number, otp: string, expiry: Date) {
    await this.userRepo.update(userId, { otp, otpExpiry: expiry });
  }

  async verifyUser(userId: number) {
    await this.userRepo.update(userId, { isVerified: true, otp: null, otpExpiry: null });
  }

  async resetPassword(userId: number, hashedPassword: string) {
    await this.userRepo.update(userId, { password: hashedPassword, otp: null, otpExpiry: null });
  }

  async update(userId: number, data: Partial<User>) {
    await this.userRepo.update(userId, data);
    return this.findById(userId);
  }

  async remove(userId: number) {
    await this.userRepo.delete(userId);
    return { message: 'User deleted' };
  }

  // payment due reminder এর জন্য
  async findUnpaidMembers(paidUserIds: number[]) {
    const query = this.userRepo.createQueryBuilder('user')
      .where('user.isVerified = :verified', { verified: true });

    if (paidUserIds.length > 0) {
      query.andWhere('user.id NOT IN (:...ids)', { ids: paidUserIds });
    }

    return query.getMany();
  }
}