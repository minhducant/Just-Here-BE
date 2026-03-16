import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { Body, Controller, Post, Query } from '@nestjs/common';

import { UserAuth } from 'src/shares/decorators/http.decorators';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';
import { CheckinService } from 'src/modules/check-in/check-in.service';
import { MailService } from 'src/modules/mail/mail.service';
import { SendMailDto } from 'src/modules/mail/dto/send-mail.dto';

@ApiTags('Check In Tools')
@Controller('checkin-tools')
@UserAuth()
export class CheckinToolsController {
  constructor(
    private readonly checkinService: CheckinService,
    private readonly mailService: MailService,
  ) {}

  @Post('send-mail')
  @ApiOperation({
    summary: '[Check In Tools] Trigger mail sending manually',
  })
  async sendMail(@Body() body: SendMailDto): Promise<void> {
    await this.mailService.sendMail(body);
  }

  @Post('fake-data')
  @ApiOperation({
    summary: '[Check In Tools] Seed fake daily check-ins for current user',
  })
  async seedFakeData(@UserID() userId: string): Promise<{ total: number }> {
    return this.checkinService.seedFakeDailyCheckins(userId);
  }

  @Post('cron/reminders')
  @ApiOperation({
    summary: '[Check In Tools] Trigger check-in reminder cron manually',
  })
  async runCheckinReminders(): Promise<{ total: number }> {
    return this.checkinService.runCheckinReminders();
  }

  @Post('cron/grace-period')
  @ApiOperation({
    summary: '[Check In Tools] Trigger grace period cron manually',
  })
  async runGracePeriodCheck(): Promise<{ total: number }> {
    return this.checkinService.runGracePeriodCheck();
  }

  @Post('cron/inactive-users')
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 5,
    description: 'Number of days (default: 5)',
  })
  @ApiOperation({
    summary: '[Check In Tools] Trigger inactive user cron manually',
  })
  async runInactiveUserCheck(
    @Query('days') days?: number,
  ): Promise<{ total: number }> {
    return this.checkinService.runInactiveUserCheck(days ?? 5);
  }
}
