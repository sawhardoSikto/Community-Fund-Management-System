import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoticeDto {
  @IsNotEmpty({ message: 'শিরোনাম ফাঁকা রাখা যাবে না' })
  @IsString({ message: 'শিরোনাম অবশ্যই টেক্সট হতে হবে' })
  title: string;

  @IsNotEmpty({ message: 'বিবরণ ফাঁকা রাখা যাবে না' })
  @IsString({ message: 'বিবরণ অবশ্যই টেক্সট হতে হবে' })
  content: string;
}
