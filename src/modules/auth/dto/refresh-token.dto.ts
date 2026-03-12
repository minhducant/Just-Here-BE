import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token', required: true })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
