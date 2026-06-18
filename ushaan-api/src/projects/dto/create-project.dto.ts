import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;
 @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  openingInvested?: number; // ✅ নতুন

  @IsDateString()
  @IsOptional()
  endDate?: string;
}