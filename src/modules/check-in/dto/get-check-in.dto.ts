import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

import { PaginationDto } from 'src/shares/dtos/pagination.dto';
import { CheckinType } from '../check-in.enum';

export class GetCheckinDto extends PaginationDto {
  @ApiPropertyOptional({
    example: '2026-03-01T00:00:00.000Z',
    description: 'Filter check-ins from this ISO date',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-31T23:59:59.999Z',
    description: 'Filter check-ins to this ISO date',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({
    enum: CheckinType,
    description: 'Filter by check-in type',
  })
  @IsOptional()
  @IsEnum(CheckinType)
  type?: CheckinType;
}
