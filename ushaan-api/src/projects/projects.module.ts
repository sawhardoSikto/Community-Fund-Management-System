import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity'; // ✅ সঠিক path
import { ProjectTransaction } from './entities/project-transaction.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { MonthlySheet } from 'src/sheets/entities/monthly-sheet.entity';
import { SheetsModule } from '../sheets/sheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectTransaction, MonthlySheet]),
    NotificationsModule,
    UsersModule,
    forwardRef(() => SheetsModule),
  ], // ✅ Project এবং ProjectTransaction entity, আর notificationsModule, usersModule  
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}