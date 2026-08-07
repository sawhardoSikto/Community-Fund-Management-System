import { IsInt, IsNotEmpty, IsString, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFineDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
