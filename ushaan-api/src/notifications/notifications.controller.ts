import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
  ) {}

  @Get('my')
  getMyNotifications(
    @Request() req,
  ) {
    return this.notificationsService.getMyNotifications(
      req.user.id,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: number,
  ) {
    return this.notificationsService.markAsRead(
      Number(id),
    );
  }

  @Patch('read-all')
  markAllAsRead(
    @Request() req,
  ) {
    return this.notificationsService.markAllAsRead(
      req.user.id,
    );
  }
}