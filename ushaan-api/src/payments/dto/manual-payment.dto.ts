import { IsInt, IsNotEmpty, IsPositive, IsString, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';

export class ManualPaymentDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsString()
  @IsOptional()
  bkashNumber?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod; // ✅ bkash/nagad/cash/card/other

  @IsString()
  @IsOptional()
  transactionNumber?: string;

  @IsString()
  @IsOptional()
  paymentDate?: string; // e.g. "2026-08-31"

  @IsOptional()
  months?: { month: number; year: number }[]; // Monthly dues and advances

  @IsOptional()
  fineIds?: number[]; // Fines
}