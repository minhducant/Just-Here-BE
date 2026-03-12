import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  Param,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SERVICES } from '@app/shared/constants/services';
import { NOTIFICATION_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserAuth } from '@app/shared/decorators/http.decorators';
import { UserID } from '@app/shared/decorators/get-user-id.decorator';
import { IdDto } from '@app/shared/dtos/param.dto';

@ApiTags('Notification')
@Controller('notification')
@UserAuth()
export class NotificationController {
  constructor(
    @Inject(SERVICES.NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: '[Notification] Get notifications' })
  async getNotifications(
    @UserID() userId: string,
    @Query() query: Record<string, any>,
  ): Promise<any> {
    return firstValueFrom(
      this.notificationClient.send(NOTIFICATION_PATTERNS.GET, { query, userId }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: '[Notification] Delete notification by _id' })
  async deleteNotification(@Param('id') notificationId: string): Promise<any> {
    return firstValueFrom(
      this.notificationClient.send(NOTIFICATION_PATTERNS.DELETE, { notificationId }),
    );
  }

  @Post('/push')
  @ApiOperation({ summary: '[Notification] Push notification to user' })
  async pushNotification(@Body() body: Record<string, any>): Promise<any> {
    return firstValueFrom(
      this.notificationClient.send(NOTIFICATION_PATTERNS.SEND, body),
    );
  }

  @Post('/read')
  @ApiOperation({ summary: '[Notification] Read notification by ID' })
  async markNotificationAsRead(@Body() body: IdDto): Promise<any> {
    return firstValueFrom(
      this.notificationClient.send(NOTIFICATION_PATTERNS.READ_BY_ID, { id: body.id }),
    );
  }

  @Post('/register')
  @ApiOperation({ summary: '[Notification] Register notification' })
  async registerNotification(
    @UserID() userId: string,
    @Body() body: Record<string, any>,
  ): Promise<any> {
    return firstValueFrom(
      this.notificationClient.send(NOTIFICATION_PATTERNS.REGISTER, { userId, ...body }),
    );
  }

  @Post('/read-all')
  @ApiOperation({ summary: '[Notification] Read all notifications' })
  async markAllNotificationsAsRead(@UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.notificationClient.send(NOTIFICATION_PATTERNS.READ_ALL, { userId }),
    );
  }
}
