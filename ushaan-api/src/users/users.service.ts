import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findAll() {
  return this.userRepo.find({
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