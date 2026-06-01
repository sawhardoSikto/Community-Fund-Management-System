import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  // Registration OTP
  async sendRegistrationOtp(email: string, name: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'USHAAN - Email Verification OTP',
      text: `
Hi ${name}!

Your OTP for email verification is: ${otp}

This OTP will expire in 10 minutes.

Welcome to USHAAN Community!
      `,
    });
  }

  // Forgot Password OTP
  async sendPasswordResetOtp(email: string, name: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'USHAAN - Password Reset OTP',
      text: `
Hi ${name}!

Your OTP for password reset is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this, please ignore this email.
      `,
    });
  }

  // Payment Due Reminder
  async sendPaymentDueReminder(email: string, name: string, month: string, year: number, amount: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: `USHAAN - Payment Due Reminder - ${month} ${year}`,
      text: `
Hi ${name}!

This is a reminder that you have not submitted your monthly payment for ${month} ${year}.

Amount Due: ${amount} Tk
Deadline: 10th of ${month} ${year}

Please submit your payment as soon as possible.

Thank you,
USHAAN Team
      `,
    });
  }
}