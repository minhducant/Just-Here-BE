import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Get, Post, Body, Query, Patch, Controller } from '@nestjs/common';

import { GetCheckinDto } from './dto/get-check-in.dto';
import { CreateCheckinDto } from './dto/create-check-in.dto';
import { UserAuth } from 'src/shares/decorators/http.decorators';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';
import { CheckinPagingResponse, CheckinService } from './check-in.service';

@ApiTags('Check In')
@Controller('checkin')
@UserAuth()
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get()
  @ApiOperation({ summary: '[Check In] Get Check In' })
  async find(
    @UserID() userId: string,
    @Query() query: GetCheckinDto,
  ): Promise<CheckinPagingResponse> {
    return this.checkinService.find(query, userId);
  }

  @Post()
  @ApiOperation({
    summary: '[Check In] Create Check In',
  })
  async createNote(
    @Body() body: CreateCheckinDto,
    @UserID() userId: string,
  ): Promise<void> {
    await this.checkinService.create(body, userId);
  }

  @Patch()
  @ApiOperation({
    summary: '[Check In] Update Check In',
  })
  async updateNote(
    @Body() body: CreateCheckinDto,
    @UserID() userId: string,
  ): Promise<void> {
    await this.checkinService.update(body, userId);
  }

  @Post('run-cron')
  @ApiExcludeEndpoint()
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 5,
    description: 'Number of days (default: 5)',
  })
  @ApiOperation({
    summary: '[Check In] Test Check In Cron manually',
  })
  async testCron(@Query('days') days?: number): Promise<{ total: number }> {
    return this.checkinService.runInactiveUserCheck(days ?? 5);
  }

  @Post('fake-data')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: '[Check In] Seed fake daily check-ins for current user',
  })
  async seedFakeData(@UserID() userId: string): Promise<{ total: number }> {
    return this.checkinService.seedFakeDailyCheckins(userId);
  }
}
