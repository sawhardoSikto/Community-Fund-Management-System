import { IsInt, IsPositive, IsString, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalaryDto {
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

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  role: string;
}