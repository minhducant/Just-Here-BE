import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginAccessTokenDto {
  @ApiProperty({ description: 'Access Token', required: true })
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}
