import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginAppleDto {
  @ApiProperty({ description: 'Apple identityToken', required: true })
  @IsNotEmpty()
  @IsString()
  identityToken: string;
}
