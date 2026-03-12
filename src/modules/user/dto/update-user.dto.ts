import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUrl,
} from 'class-validator';

import { Language } from 'src/shares/enums/language.enum';
import {
  CheckinTime,
  GracePeriod,
  UserStatus,
  ThemeType,
  CheckinType,
} from 'src/shares/enums/user.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User display name',
    example: 'duc',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Full name of user',
    example: 'Đỗ Minh Đức',
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '0901234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: '[duc@gmail.com](mailto:duc@gmail.com)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Birthday',
    example: '1999-12-03',
  })
  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @ApiPropertyOptional({
    description: 'User language',
    enum: Language,
    example: Language.VI,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: 'Gender (0: Female, 1: Male, 2: Other)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  gender?: number;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Check-in time setting',
    enum: CheckinTime,
  })
  @IsOptional()
  @IsEnum(CheckinTime)
  checkin_time?: CheckinTime;

  @ApiPropertyOptional({
    description: 'Grace period setting',
    enum: GracePeriod,
  })
  @IsOptional()
  @IsEnum(GracePeriod)
  grace_period?: GracePeriod;

  @ApiPropertyOptional({
    description: 'Theme setting',
    enum: ThemeType,
    example: ThemeType.SYSTEM,
  })
  @IsOptional()
  @IsEnum(ThemeType)
  theme?: ThemeType;

  @ApiPropertyOptional({
    description: 'Check-in type',
    enum: CheckinType,
    example: CheckinType.DAILY,
  })
  @IsOptional()
  @IsEnum(CheckinType)
  checkin_type?: CheckinType;

  @ApiPropertyOptional({
    description: 'Timezone offset',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  time_zone?: number;

  @ApiPropertyOptional({
    description: 'Avatar image url',
    example: 'https://cdn.app.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'User banned status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_banned?: boolean;
}
