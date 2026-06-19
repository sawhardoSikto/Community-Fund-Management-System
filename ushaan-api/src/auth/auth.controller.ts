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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix =
        Date.now() + '-' + Math.round(Math.random() * 1e9);

      cb(
        null,
        uniqueSuffix + extname(file.originalname),
      );
    },
  }),

  fileFilter: (req, file, cb) => {
    if (
      !file.mimetype.match(
        /\/(jpg|jpeg|png|gif|webp)$/
      )
    ) {
      return cb(
        new Error('Only image files are allowed!'),
        false,
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

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