import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const FRONTEND_URL =
  process.env.FRONTEND_URL ?? 'https://hackahoy.duckdns.org';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly to: string;

  constructor() {
    const user = process.env.EMAIL_USER?.trim() ?? '';
    const pass = process.env.EMAIL_PASS?.trim() ?? '';
    this.to = process.env.EMAIL_TO?.trim() ?? '';
    this.from =
      process.env.EMAIL_FROM?.trim() ||
      (user ? `"Hackahoy Security" <${user}>` : '');

    if (!user || !pass || !this.to) {
      this.transporter = null;
      this.logger.warn(
        'Email notifications are disabled until EMAIL_USER, EMAIL_PASS, and EMAIL_TO are configured.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE?.trim() || 'gmail',
      auth: { user, pass },
    });
  }

  async sendSecurityAlert(ip: string, email: string) {
    if (!this.transporter) return;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: '[Hackahoy] Security alert',
        text: `A security threat was detected.\n\nBlocked IP: ${ip}\nAccount: ${email}\nReason: automatic block after repeated login failures`,
      });
    } catch (error) {
      this.logger.error('Failed to send a security alert email', error);
    }
  }

  async sendDailyReportMail(nickname: string, stats: any, details: string) {
    if (!this.transporter) return;

    const today = new Date().toISOString().split('T')[0];
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: `[Hackahoy] Daily security report (${today})`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Hello, ${nickname}</h2>
            <p>Security activity from the last 24 hours is summarized below.</p>
            <h3>Summary</h3>
            <ul><li><strong>Total blocks:</strong> ${stats.totalCount}</li></ul>
            <h3>Details</h3>
            <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${details}</pre>
            <a href="${FRONTEND_URL}/admin/notifications">Open admin notifications</a>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send the daily security report', error);
    }
  }
}
