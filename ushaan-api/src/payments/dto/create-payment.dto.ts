import { IsInt, IsNotEmpty, IsString, Min, Max, IsEnum, IsOptional,IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  year: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod; // ✅ bkash/nagad/cash/card/other

  @IsString()
  @IsOptional()
  transactionNumber?: string; // ✅ number বা ID (cash হলে লাগবে না)

  @IsString()
  @IsOptional()
  note?: string;
}