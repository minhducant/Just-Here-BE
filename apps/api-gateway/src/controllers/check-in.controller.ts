import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import {
  Get,
  Post,
  Body,
  Query,
  Patch,
  Controller,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SERVICES } from '@app/shared/constants/services';
import { CHECK_IN_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserAuth } from '@app/shared/decorators/http.decorators';
import { UserID } from '@app/shared/decorators/get-user-id.decorator';

@ApiTags('Check In')
@Controller('checkin')
@UserAuth()
export class CheckInController {
  constructor(
    @Inject(SERVICES.CHECK_IN_SERVICE) private readonly checkInClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: '[Check In] Get Check In' })
  async find(@UserID() userId: string, @Query() query: Record<string, any>): Promise<any> {
    return firstValueFrom(
      this.checkInClient.send(CHECK_IN_PATTERNS.FIND, { query, userId }),
    );
  }

  @Post()
  @ApiOperation({ summary: '[Check In] Create Check In' })
  async createCheckin(@Body() body: Record<string, any>, @UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.checkInClient.send(CHECK_IN_PATTERNS.CREATE, { body, userId }),
    );
  }

  @Patch()
  @ApiOperation({ summary: '[Check In] Update Check In' })
  async updateCheckin(@Body() body: Record<string, any>, @UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.checkInClient.send(CHECK_IN_PATTERNS.UPDATE, { body, userId }),
    );
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
  @ApiOperation({ summary: '[Check In] Test Check In Cron manually' })
  async testCron(@Query('days') days?: number): Promise<any> {
    return firstValueFrom(
      this.checkInClient.send(CHECK_IN_PATTERNS.RUN_CRON, { days: days ?? 5 }),
    );
  }
}
