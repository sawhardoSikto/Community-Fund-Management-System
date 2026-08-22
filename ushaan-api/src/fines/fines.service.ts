import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fine, FineStatus } from './entities/fine.entity';
import { CreateFineDto } from './dto/create-fine.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FinesService {
  constructor(
    @InjectRepository(Fine)
    private readonly fineRepo: Repository<Fine>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async create(dto: CreateFineDto): Promise<Fine> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const fine = this.fineRepo.create({
      userId: dto.userId,
      amount: dto.amount,
      reason: dto.reason,
      status: FineStatus.PENDING,
    });

    return this.fineRepo.save(fine);
  }

  async findAll(): Promise<Fine[]> {
    return this.fineRepo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Fine> {
    const fine = await this.fineRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!fine) {
      throw new NotFoundException('Fine not found');
    }
    return fine;
  }

  async findUserPending(userId: number): Promise<Fine[]> {
    return this.fineRepo.find({
      where: { userId, status: FineStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async findUserAll(userId: number): Promise<Fine[]> {
    return this.fineRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const fine = await this.findOne(id);
    if (fine.status === FineStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid fine');
    }
    await this.fineRepo.remove(fine);
    return { message: 'Fine deleted successfully' };
  }
}
