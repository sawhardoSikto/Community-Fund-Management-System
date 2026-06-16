import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date: string;
}