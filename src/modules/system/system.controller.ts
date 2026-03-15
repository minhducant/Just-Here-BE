import { Controller, Get, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { SystemService } from './system.service';

@Controller({
  path: 'system',
})
@ApiExcludeController()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('metrics')
  getMetrics() {
    return this.systemService.getMetrics();
  }

  @Get('logs')
  getLogs(@Query('limit') limit?: string) {
    const parsedLimit = Number.parseInt(limit || '200', 10);
    return this.systemService.getLogs(parsedLimit);
  }
}
