import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto, file?: Express.Multer.File) {
    // ১. email check
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    // ২. password hash
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // ৩. OTP বানাও
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // ৪. photo URL — file আসলে path বানাও, না আসলে null
    const photoUrl = file ? `/uploads/${file.filename}` : null;

    // ৫. User save
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      nid: dto.nid,
      monthlyAmount: dto.monthlyAmount || 200,
      role: dto.role || 'member',
      isVerified: false,
      otp,
      otpExpiry,
      photoUrl,  // ← এটাই নতুন
    });

    // ৬. OTP email
    await this.mailService.sendRegistrationOtp(user.email, user.name, otp);

    return {
      message: 'Registration successful! Please verify your email with the OTP sent.',
      email: user.email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Email already verified');
    if (!user.otp || !user.otpExpiry) throw new BadRequestException('No OTP requested');
    if (new Date() > user.otpExpiry) throw new BadRequestException('OTP expired');
    if (user.otp !== dto.otp) throw new BadRequestException('Invalid OTP');

    await this.usersService.verifyUser(user.id);
    return { message: 'Email verified successfully! You can now login.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isVerified) throw new UnauthorizedException('Please verify your email first');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        monthlyAmount: user.monthlyAmount,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Email not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.usersService.saveOtp(user.id, otp, expiry);
    await this.mailService.sendPasswordResetOtp(user.email, user.name, otp);

    return { message: 'OTP sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Email not found');
    if (!user.otp || !user.otpExpiry) throw new BadRequestException('No OTP requested');
    if (new Date() > user.otpExpiry) throw new BadRequestException('OTP expired');
    if (user.otp !== dto.otp) throw new BadRequestException('Invalid OTP');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.resetPassword(user.id, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'Profile fetched',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        monthlyAmount: user.monthlyAmount,
        nid: user.nid,
        photoUrl: user.photoUrl,
        createdAt: user.createdAt,
      },
    };
  }
}