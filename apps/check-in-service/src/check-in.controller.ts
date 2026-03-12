import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CHECK_IN_PATTERNS } from '@app/shared/constants/message-patterns';
import { CheckInService } from './check-in.service';

@Controller()
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @MessagePattern(CHECK_IN_PATTERNS.FIND)
  async find(@Payload() data: { query: any; userId: string }): Promise<any> {
    return this.checkInService.find(data.query, data.userId);
  }

  @MessagePattern(CHECK_IN_PATTERNS.CREATE)
  async create(@Payload() data: { body: any; userId: string }): Promise<void> {
    return this.checkInService.create(data.body, data.userId);
  }

  @MessagePattern(CHECK_IN_PATTERNS.UPDATE)
  async update(@Payload() data: { body: any; userId: string }): Promise<void> {
    return this.checkInService.update(data.body, data.userId);
  }

  @MessagePattern(CHECK_IN_PATTERNS.RUN_CRON)
  async runCron(@Payload() data: { days: number }): Promise<{ total: number }> {
    return this.checkInService.runInactiveUserCheck(data.days);
  }
}
