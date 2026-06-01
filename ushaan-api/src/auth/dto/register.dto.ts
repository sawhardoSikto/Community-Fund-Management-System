import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  nid?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  monthlyAmount?: number; // 200 বা 400, default 200

  @IsString()
  @IsOptional()
  @IsIn(['member', 'accountant', 'admin', 'general_secretary'])
  role?: string;
  
}