import {
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import {
  Get,
  Post,
  Body,
  Query,
  Patch,
  Delete,
  Controller,
} from '@nestjs/common';

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

  @Delete()
  @ApiOperation({
    summary: '[Check In] Delete all check-ins',
  })
  async deleteAll(@UserID() userId: string): Promise<{ deletedCount: number }> {
    return this.checkinService.deleteAll(userId);
  }
}
