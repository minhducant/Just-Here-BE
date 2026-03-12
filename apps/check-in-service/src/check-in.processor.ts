import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { User, UserDocument } from '@app/shared/schemas/user.schema';
import { Contact, ContactDocument } from '@app/shared/schemas/contact.schema';
import { JUST_HERE_QUEUE } from '@app/shared/queue/justhere.queue';
import { mailConfig } from '@app/shared/configs/mail.config';
import * as nodemailer from 'nodemailer';

@Processor(JUST_HERE_QUEUE)
export class CheckInProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckInProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {
    super();
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.port === 465,
      service: mailConfig.service || undefined,
      auth: { user: mailConfig.auth.user, pass: mailConfig.auth.pass },
    });
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'send-checkin-reminder':
        await this.handleCheckinReminder(job.data);
        break;
      case 'send-warning':
        await this.handleGracePeriodWarning(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCheckinReminder(data: { userId: string }): Promise<void> {
    const { userId } = data;
    this.logger.log(`Sending check-in reminder to user ${userId}`);
    // Push notification would be sent here via notification-service
  }

  private async handleGracePeriodWarning(data: { userId: string; days: number }): Promise<void> {
    const { userId, days } = data;
    this.logger.log(`Grace period warning for user ${userId} (${days} days inactive)`);

    if (!mailConfig.enable) {
      return;
    }

    const [user, contacts] = await Promise.all([
      this.userModel.findById(userId).exec(),
      this.contactModel.find({ user_id: userId }),
    ]);

    if (!contacts || contacts.length === 0) {
      this.logger.log(`No contacts found for user ${userId}`);
      return;
    }

    const userName = user?.name || user?.full_name || 'Your contact';
    const emailPromises = contacts
      .filter((c) => c.email)
      .map((contact) =>
        this.transporter
          .sendMail({
            from: mailConfig.from,
            to: contact.email,
            subject: `Check-in alert for ${userName}`,
            html: `<p>Hello ${contact.name || ''},</p><p>${userName} has not checked in for ${days} day${days !== 1 ? 's' : ''}. Please reach out to make sure they are okay.</p>`,
          })
          .catch((err) =>
            this.logger.error(
              `Failed to send email to ${contact.email}: ${err.message}`,
              err.stack,
            ),
          ),
      );

    await Promise.all(emailPromises);
    this.logger.log(
      `Grace period warning sent for user ${userId}: notified ${emailPromises.length} contact(s)`,
    );
  }
}
