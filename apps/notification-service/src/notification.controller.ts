import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { NOTIFICATION_PATTERNS } from '@app/shared/constants/message-patterns';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(NOTIFICATION_PATTERNS.GET)
  async getNotifications(@Payload() data: { query: any; userId: string }): Promise<any> {
    return this.notificationService.getNotifications(data.query, data.userId);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.DELETE)
  async deleteNotification(@Payload() data: { notificationId: string }): Promise<void> {
    return this.notificationService.deleteNotificationById(data.notificationId);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.SEND)
  async sendNotification(@Payload() data: any): Promise<void> {
    return this.notificationService.sendNotification(data);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.READ_BY_ID)
  async readById(@Payload() data: { id: string }): Promise<any> {
    return this.notificationService.readById(data.id);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.REGISTER)
  async register(@Payload() data: { userId: string; notification_token: string }): Promise<any> {
    return this.notificationService.registerNotification(data.userId, data);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.READ_ALL)
  async readAll(@Payload() data: { userId: string }): Promise<void> {
    return this.notificationService.readAll(data.userId);
  }
}
