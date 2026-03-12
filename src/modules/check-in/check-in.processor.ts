import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { MailService } from 'src/modules/mail/mail.service';
import { User, UserDocument } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { NotificationService } from '../notification/notification.service';
import { Contact, ContactDocument } from '../contact/schemas/contact.schema';

@Processor(JUST_HERE_QUEUE)
export class CheckinProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckinProcessor.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {
    super();
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

  private async handleCheckinReminder(data: {
    userId: string;
  }): Promise<void> {
    const { userId } = data;
    await this.notificationService.sendNotification({
      user_id: userId,
      title: "Time to check in!",
      body: "Don't forget to check in today.",
      data: {},
    });
  }

  private async handleGracePeriodWarning(data: {
    userId: string;
    days: number;
  }): Promise<void> {
    const { userId, days } = data;
    await this.notificationService.sendNotification({
      user_id: userId,
      title: 'We miss you!',
      body: `You haven't checked in for ${days} day${days !== 1 ? 's' : ''}. Please check in to let your loved ones know you're okay.`,
      data: {},
    });
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
        this.mailService
          .sendHtmlMail(
            contact.email,
            `Check-in alert for ${userName}`,
            `<p>Hello ${contact.name || ''},</p><p>${userName} has not checked in for ${days} day${days !== 1 ? 's' : ''}. Please reach out to make sure they are okay.</p>`,
          )
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
