import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RegisterNotificationDto {
  @ApiProperty({ required: true })
  @IsString()
  readonly notification_token: string;

  @ApiPropertyOptional({
    example: 'ios',
    description: 'Device type used for this push token',
  })
  @IsOptional()
  @IsString()
  readonly device_type?: string;
}
