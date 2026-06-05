import { IsInt, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MemberOpeningBalanceDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsNumber()
  @Type(() => Number)
  totalPaid: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  upToMonth: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  upToYear: number;
}