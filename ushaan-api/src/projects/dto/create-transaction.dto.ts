import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../entities/project-transaction.entity';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date: string;
}