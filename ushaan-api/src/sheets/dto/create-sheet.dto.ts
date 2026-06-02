import { IsInt, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSheetDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  year: number;
}