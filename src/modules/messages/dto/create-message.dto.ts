import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsMongoId,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

import { MessageType } from '../constants';

export class CreateMessageDto {
  @ApiProperty({ description: 'Author user id (MongoId)' })
  @IsMongoId()
  author: string;

  @ApiProperty({ enum: Object.values(MessageType) })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({ description: 'Text content for text messages' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Optional array of attachment URLs (if sending by URL)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  attachments?: { url: string; filename?: string }[];

  @ApiPropertyOptional({
    description: 'Poll options if type === poll',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  pollOptions?: string[];
}
