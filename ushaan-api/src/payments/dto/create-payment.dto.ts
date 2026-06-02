import { IsInt, IsNotEmpty, IsPositive, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  @IsNotEmpty()
  bkashNumber: string;
}