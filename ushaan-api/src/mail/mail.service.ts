import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Resend } from 'resend';


@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  constructor() {}

  // Registration OTP
async sendRegistrationOtp(email: string, name: string, otp: string) {
  await this.resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'USHAAN - Email Verification OTP',
    html: `
      <h2>Hi ${name}!</h2>
      <p>Your OTP for email verification is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <p>Welcome to USHAAN Community!</p>
    `,
  });
}
  // Forgot Password OTP
async sendPasswordResetOtp(
  email: string,
  name: string,
  otp: string,
) {
  await this.resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'USHAAN - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color:#f59e0b;">USHAAN Community</h2>

        <p>Hello ${name},</p>

        <p>You requested to reset your password.</p>

        <p>Your OTP is:</p>

        <div style="
          font-size:32px;
          font-weight:bold;
          text-align:center;
          background:#f3f4f6;
          padding:15px;
          border-radius:8px;
          letter-spacing:5px;
          margin:20px 0;
        ">
          ${otp}
        </div>

        <p>This OTP will expire in <strong>10 minutes</strong>.</p>

        <p>If you did not request a password reset, please ignore this email.</p>

        <br>

        <p>Regards,<br><strong>USHAAN Team</strong></p>
      </div>
    `,
  });
}

  // Payment Due Reminder
 async sendPaymentDueReminder(
  email: string,
  name: string,
  month: string,
  year: number,
  amount: number,
) {
  await this.resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: `USHAAN - Payment Due Reminder - ${month} ${year}`,
    html: `
      <h2>Hi ${name}!</h2>
      <p>You have a due payment.</p>
      <p>Amount: <b>${amount} Tk</b></p>
      <p>Month: <b>${month} ${year}</b></p>
    `,
  });
}
}