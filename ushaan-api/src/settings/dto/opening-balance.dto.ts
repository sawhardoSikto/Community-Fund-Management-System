import { IsNumber, IsInt, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class OpeningBalanceDto {
  @IsNumber()
  @Type(() => Number)
  openingCashInHand: number;

  @IsNumber()
  @Type(() => Number)
  openingTotalInvested: number;

  @IsNumber()
  @Type(() => Number)
  openingTotalProfit: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  openingMonth: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  openingYear: number;
}
