import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { DataDto } from './send-notification.dto';

export class TestNotificationDto {
  @ApiPropertyOptional({
    example: 'Test notification',
    description: 'Notification title for test push',
  })
  @IsOptional()
  @IsString()
  readonly title?: string;

  @ApiPropertyOptional({
    example: 'This is a test notification from Just Here.',
    description: 'Notification body for test push',
  })
  @IsOptional()
  @IsString()
  readonly body?: string;

  @ApiPropertyOptional({
    type: DataDto,
    example: { source: 'manual-test' },
    description: 'Optional custom data payload',
  })
  @IsOptional()
  @ValidateNested({ each: false })
  @Type(() => DataDto)
  readonly data?: DataDto;
}
