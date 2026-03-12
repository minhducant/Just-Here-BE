import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import { mailConfig } from '@app/shared/configs/mail.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.port === 465,
      service: mailConfig.service || undefined,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
    });
  }

  async sendMail(sendMailDto: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<void> {
    if (!mailConfig.enable) {
      this.logger.warn('Mail service is disabled. Skipping email send.');
      return;
    }

    const { to, subject, text, html, cc, bcc } = sendMailDto;
    try {
      const info = await this.transporter.sendMail({
        from: mailConfig.from,
        to,
        subject,
        text,
        html,
        cc,
        bcc,
      });
      this.logger.log(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
