import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendMailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Hello from Just-Here!' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ example: 'Plain text content of the email.' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ example: '<h1>Hello!</h1>' })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiPropertyOptional({
    example: ['cc@example.com'],
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({
    example: ['bcc@example.com'],
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  bcc?: string[];
}
