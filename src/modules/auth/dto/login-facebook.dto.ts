import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginFacebookDto {
  @ApiProperty({ description: 'Facebook access_token', required: true })
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}
