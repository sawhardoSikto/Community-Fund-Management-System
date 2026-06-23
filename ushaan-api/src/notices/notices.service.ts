import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepo: Repository<Notice>,
  ) {}

  async create(dto: CreateNoticeDto, authorId: number) {
    const notice = this.noticeRepo.create({
      ...dto,
      authorId,
    });
    await this.noticeRepo.save(notice);
    return { message: 'Notice created successfully', data: notice };
  }

  async findAll() {
    const notices = await this.noticeRepo.find({
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });
    
    // Remove password from author info for security
    notices.forEach(n => {
      if (n.author) {
        const author = n.author as any;
        delete author.password;
        delete author.otp;
        delete author.otpExpiry;
      }
    });
    
    return { message: 'Notices fetched successfully', data: notices };
  }

  async findOne(id: number) {
    const notice = await this.noticeRepo.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!notice) {
      throw new NotFoundException(`Notice with ID ${id} not found`);
    }
    if (notice.author) {
      const author = notice.author as any;
      delete author.password;
      delete author.otp;
      delete author.otpExpiry;
    }
    return { message: 'Notice fetched successfully', data: notice };
  }

  async update(id: number, dto: UpdateNoticeDto) {
    const notice = await this.noticeRepo.preload({
      id,
      ...dto,
    });
    if (!notice) {
      throw new NotFoundException(`Notice with ID ${id} not found`);
    }
    await this.noticeRepo.save(notice);
    return { message: 'Notice updated successfully', data: notice };
  }

  async remove(id: number) {
    const notice = await this.findOne(id);
    await this.noticeRepo.remove(notice.data);
    return { message: 'Notice deleted successfully', id };
  }
}
