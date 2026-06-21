import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(
    userId: number,
    message: string,
  ) {
    const notification =
      this.notificationRepo.create({
        userId,
        message,
      });

    return this.notificationRepo.save(
      notification,
    );
  }

  async createIfNotExists(
    userId: number,
    message: string,
  ) {
    const existing = await this.notificationRepo.findOne({
      where: { userId, message },
    });

    if (existing) {
      return existing;
    }

    return this.create(userId, message);
  }

  async getMyNotifications(
    userId: number,
  ) {
    return this.notificationRepo.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async markAsRead(id: number) {
    await this.notificationRepo.update(
      id,
      {
        isRead: true,
      },
    );

    return {
      message:
        'Notification marked as read',
    };
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );

    return {
      message: 'All notifications marked as read',
    };
  }
}