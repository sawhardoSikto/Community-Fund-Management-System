import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { IsPublic } from './public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/multer.config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @IsPublic()
  @Post('register')
  @UseInterceptors(
    FileInterceptor('photo', multerConfig),
  )
  register(
    @Body() dto: RegisterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.register(dto, file);
  }

  @IsPublic()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @IsPublic()
  @Post('forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  @Get('me')
  getProfile(@Request() req) {
    return this.authService.getProfile(
      req.user.id,
    );
  }

  @Get('current-user')
  getCurrentUser(@Request() req) {
    return req.user;
  }
}