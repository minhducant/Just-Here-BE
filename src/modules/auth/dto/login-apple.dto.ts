import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginAppleDto {
  @ApiProperty({ description: 'Apple identityToken', required: true })
  @IsNotEmpty()
  @IsString()
  identityToken: string;

  @ApiProperty({
    description: 'Apple full name from client (usually available on first login)',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;
}
