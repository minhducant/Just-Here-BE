import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Contact name',
    example: 'Nguyen Van A',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'example@gmail.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Country code',
    example: '+84',
  })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  country_code?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '912345678',
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone_number?: string;
}
