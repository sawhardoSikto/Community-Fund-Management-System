import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, file?: Express.Multer.File) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const photoUrl = file
      ? `/uploads/${file.filename}`
      : null;

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      nid: dto.nid,
      monthlyAmount: dto.monthlyAmount || 200,
     role: 'member',
      isVerified: true,
      photoUrl,
    });

    return {
      message: 'Registration successful',
      data: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isMatch = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
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
        photoUrl: user.photoUrl,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(
      dto.email,
    );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (
      user.phone !== dto.phone ||
      user.nid !== dto.nid
    ) {
      throw new BadRequestException(
        'Email, Phone or NID does not match',
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      10,
    );

    await this.usersService.resetPassword(
      user.id,
      hashedPassword,
    );

    return {
      message: 'Password reset successful',
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(
      userId,
    );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

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