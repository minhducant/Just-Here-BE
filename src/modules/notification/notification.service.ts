import mongoose, { Model } from 'mongoose';
import * as firebase from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { MailService } from 'src/modules/mail/mail.service';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { GetNotificationDto } from './dto/get-notifications.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { SendNotificationDto } from './dto/send-notification.dto';
import { TestNotificationDto } from './dto/test-notification.dto';
import { RegisterNotificationDto } from './dto/register-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  NotificationToken,
  NotificationTokenDocument,
} from './schemas/notification_token.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationToken.name)
    private notificationTokenModel: Model<NotificationTokenDocument>,
    private readonly mailService: MailService,
  ) {}

  async getNotifications(
    GetNotificationsDto: GetNotificationDto,
    user_id: string,
  ): Promise<ResPagingDto<Notification[]>> {
    const { sort, page, limit } = GetNotificationsDto;
    const query: any = { user_id: new mongoose.Types.ObjectId(user_id) };
    const pipeline = [
      { $match: query },
      { $sort: { createdAt: sort } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
    const [result, total] = await Promise.all([
      this.notificationModel.aggregate(pipeline).exec(),
      this.notificationModel.countDocuments(query),
    ]);
    return {
      result,
      total,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(user_id: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationModel.countDocuments({
      user_id: new mongoose.Types.ObjectId(user_id),
      is_read: false,
    });

    return { unreadCount };
  }

  async registerNotification(
    user_id: string,
    payload: RegisterNotificationDto,
  ): Promise<NotificationToken> {
    const { notification_token, device_type } = payload;
    if (!notification_token?.trim()) {
      throw new BadRequestException('Notification token is required');
    }
    const existingNotificationToken =
      await this.notificationTokenModel.findOneAndUpdate(
        { user_id, notification_token },
        {
          user_id,
          notification_token: notification_token.trim(),
          device_type: device_type?.trim() || '',
          status: 'ACTIVE',
        },
        { upsert: true, new: true },
      );
    await this.notificationTokenModel.deleteMany({
      _id: { $ne: existingNotificationToken._id },
      notification_token: notification_token.trim(),
      user_id: { $ne: user_id },
    });
    return existingNotificationToken;
  }

  async unregisterNotification(
    user_id: string,
    payload: RegisterNotificationDto,
  ): Promise<{ success: boolean }> {
    const notificationToken = payload.notification_token?.trim();
    if (!notificationToken) {
      throw new BadRequestException('Notification token is required');
    }
    await this.notificationTokenModel.deleteOne({
      user_id,
      notification_token: notificationToken,
    });
    return { success: true };
  }

  async sendTestNotification(
    user_id: string,
    payload: TestNotificationDto,
  ): Promise<void> {
    await this.sendNotification({
      user_id,
      title: payload.title?.trim() || 'Test notification',
      body:
        payload.body?.trim() || 'This is a test notification from Just Here.',
      data: payload.data || { source: 'manual-test' },
    });
  }

  async sendNotification(sendNotificationDto: SendNotificationDto) {
    const { user_id, title, body, data } = sendNotificationDto;
    try {
      await this.notificationModel.create({
        user_id,
        title,
        body,
        data,
        is_read: false,
      });
      const tokens = await this.notificationTokenModel
        .aggregate([
          { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
          { $project: { notification_token: 1 } },
        ])
        .exec();
      if (tokens && tokens.length !== 0) {
        const registrationTokens = tokens?.map(
          (token) => token.notification_token,
        );
        const message: firebase.messaging.MessagingPayload = {
          notification: {
            title: title,
            body: body,
          },
          data: data,
        };
        this.logger.log(
          `Push notification queued for ${registrationTokens.length} device(s) of user ${user_id}`,
        );
        await firebase.messaging().sendEachForMulticast({
          tokens: registrationTokens,
          notification: {
            title: title,
            body: body,
          },
          data: data,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${user_id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendNotificationWithEmail(
    sendNotificationDto: SendNotificationDto,
    emailOptions: { to: string; emailSubject?: string },
  ): Promise<void> {
    await this.sendNotification(sendNotificationDto);

    const { to, emailSubject } = emailOptions;
    const { title, body } = sendNotificationDto;
    const safeBody = body
      ? body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      : '';
    try {
      await this.mailService.sendHtmlMail(
        to,
        emailSubject || title,
        `<p>${safeBody}</p>`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email notification to ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  async readById(id: string): Promise<Notification | null> {
    try {
      await this.notificationModel.findByIdAndUpdate(
        id,
        { $set: { is_read: true } },
        { new: true },
      );
      return;
    } catch (error) {
      this.logger.error('Error occurred while updating notification:', error);
      return null;
    }
  }

  async readAll(user_id: string): Promise<void> {
    try {
      await this.notificationModel.updateMany(
        { user_id },
        { $set: { is_read: true } },
      );
    } catch (error) {
      this.logger.error('Error occurred while updating notifications:', error);
    }
  }

  async deleteNotificationById(notificationId: string): Promise<void> {
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }
}
