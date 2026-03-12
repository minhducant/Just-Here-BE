import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  Min,
  Max,
  IsUrl,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  IsMongoId,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidationArguments,
  ValidatorConstraintInterface,
  IsEmail,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Contact name',
    example: 'Nguyen Van A',
  })
  @IsString()
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
  @IsOptional()
  country_code?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '912345678',
  })
  @IsString()
  @IsOptional()
  phone_number?: string;
}
