import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          family: 4, // Force IPv4
          port: 587,
          secure: false,
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
          tls:{
            rejectUnauthorized: false
          },
        },
        defaults: {
          from: `"USHAAN" <${configService.get('MAIL_USER')}>`,
        },
      }),
      inject: [ConfigService],
    }), 
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}