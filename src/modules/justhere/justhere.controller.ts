import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Get, Post, Body, Query, Controller } from '@nestjs/common';

import { JustHere } from './schemas/justhere.schema';
import { JustHereService } from './justhere.service';
import { GetJustHereDto } from './dto/get-justhere.dto';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { CreateJustHereDto } from './dto/create-justhere.dto';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';

@ApiTags('Just Here')
@Controller('justhere')
export class NoteController {
  constructor(private justhereService: JustHereService) {}

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: '[Just Here] Get Just Here' })
  async find(
    @UserID() userId: string,
    @Query() query: GetJustHereDto,
  ): Promise<ResPagingDto<JustHere[]>> {
    return this.justhereService.find(query, userId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Just Here] Create Just Here',
  })
  async createNote(
    @Body() body: CreateJustHereDto,
    @UserID() userId: string,
  ): Promise<void> {
    await this.justhereService.create(body, userId);
  }

  @ApiBearerAuth()
  @Post('run-cron')
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 5,
    description: 'Number of days (default: 5)',
  })
  @ApiOperation({
    summary: '[Just Here] Test JustHere Cron manually',
  })
  async testCron(@Query('days') days?: number): Promise<{ total: number }> {
    return this.justhereService.runInactiveUserCheck(days ?? 5);
  }
}
