import { IsInt, IsNotEmpty, IsPositive, IsString, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';

export class ManualPaymentDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  year: number;

  @IsString()
  @IsNotEmpty()
  bkashNumber: string;

  @IsString()
  @IsOptional()
  note?: string;
   @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod; // ✅ bkash/nagad/cash/card/other
  
    @IsString()
    @IsOptional()
    transactionNumber?: string;
}