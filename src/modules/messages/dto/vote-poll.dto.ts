import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsInt, Min } from 'class-validator';

export class VotePollDto {
  @ApiProperty({ description: 'Voter user id' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ description: 'Index of option voted (0-based)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  optionIndex: number;
}
