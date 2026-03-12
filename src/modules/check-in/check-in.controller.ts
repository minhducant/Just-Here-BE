import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Get, Post, Body, Query, Patch, Controller } from '@nestjs/common';

import { Checkin } from './schemas/check-in.schema';
import { CheckinService } from './check-in.service';
import { GetCheckinDto } from './dto/get-check-in.dto';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { CreateCheckinDto } from './dto/create-check-in.dto';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';
import { UserAuth } from 'src/shares/decorators/http.decorators';

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
  ): Promise<ResPagingDto<Checkin[]>> {
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
}
