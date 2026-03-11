import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginGoogleDto {
  @ApiProperty({ description: 'Google ID token', required: true })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}