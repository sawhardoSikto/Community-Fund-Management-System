import { IsInt, IsNotEmpty, IsPositive, IsString, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
}