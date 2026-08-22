import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fine } from './entities/fine.entity';
import { User } from '../users/entities/user.entity';
import { FinesController } from './fines.controller';
import { FinesService } from './fines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fine, User])],
  controllers: [FinesController],
  providers: [FinesService],
  exports: [FinesService, TypeOrmModule],
})
export class FinesModule { }
