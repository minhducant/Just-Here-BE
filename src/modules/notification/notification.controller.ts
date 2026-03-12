import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  Param,
} from '@nestjs/common';

import { IdDto } from 'src/shares/dtos/param.dto';
import { Notification } from './schemas/notification.schema';
import { NotificationService } from './notification.service';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { GetNotificationDto } from './dto/get-notifications.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';
import { RegisterNotificationDto } from './dto/register-notification.dto';
import { UserAuth } from 'src/shares/decorators/http.decorators';

@ApiTags('Notification')
@Controller('notification')
@UserAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '[Notification] Get notifications' })
  async getNotifications(
    @UserID() user_id: string,
    @Query() query: GetNotificationDto,
  ): Promise<ResPagingDto<Notification[]>> {
    return this.notificationService.getNotifications(query, user_id);
  }

  @Delete('/:id')
  @ApiOperation({ summary: '[Notification] Delete notification by _id' })
  async deleteNotification(@Param('id') notificationId: string): Promise<void> {
    await this.notificationService.deleteNotificationById(notificationId);
  }

  @Post('/push')
  @ApiOperation({ summary: '[Notification] Push notification to user' })
  async pushNotification(
    @Body() SendNotificationDto: SendNotificationDto,
  ): Promise<void> {
    return this.notificationService.sendNotification(SendNotificationDto);
  }

  @Post('/read')
  @ApiOperation({ summary: '[Notification] Read notification by ID' })
  async markNotificationAsRead(
    @Body() IdDto: IdDto,
  ): Promise<Notification | null> {
    return this.notificationService.readById(IdDto.id);
  }

  @Post('/register')
  @ApiOperation({ summary: '[Notification] Register notification' })
  async registerNotification(
    @UserID() user_id: string,
    @Body() RegisterNotificationDto: RegisterNotificationDto,
  ): Promise<void> {
    return this.notificationService.registerNotification(
      user_id,
      RegisterNotificationDto,
    );
  }

  @Post('/read-all')
  @ApiOperation({ summary: '[Notification] Read all notifications' })
  async markAllNotificationsAsRead(@UserID() user_id: string): Promise<void> {
    return this.notificationService.readAll(user_id);
  }
}
