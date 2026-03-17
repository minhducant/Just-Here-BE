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
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';

import {
  MoodValue,
  CheckinType,
} from 'src/modules/check-in/check-in.enum';

@ValidatorConstraint({ name: 'TravelLocationRequired', async: false })
export class TravelLocationRequired implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const dto = args.object as any;
    if (dto.type === CheckinType.TRAVEL) {
      return (
        typeof dto.latitude === 'number' && typeof dto.longitude === 'number'
      );
    }
    return true;
  }
  defaultMessage() {
    return 'Travel type requires latitude and longitude';
  }
}

export class CreateCheckinDto {
  @ApiProperty({
    example: new Date(),
    type: String,
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    enum: CheckinType,
    default: CheckinType.DAILY,
  })
  @IsOptional()
  @IsEnum(CheckinType)
  type?: CheckinType = CheckinType.DAILY;

  @ApiProperty({
    enum: MoodValue,
    example: MoodValue.FRUSTRATED,
  })
  @IsEnum(MoodValue)
  mood: MoodValue;

  @ApiProperty({
    example: 21.02776,
    required: false,
    description: 'Latitude',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    example: 105.83416,
    required: false,
    description: 'Longitude',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    example: 'https://cdn.example.com/justhere/image.jpg',
    required: false,
    maxLength: 500,
    description: 'Image URL',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  image_url?: string;

  @ApiProperty({
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @ApiProperty({
    example: '69b2fc9b210b733185a321e0',
    required: false,
    description: 'Deprecated. User id is taken from access token.',
  })
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @Validate(TravelLocationRequired)
  private readonly _travelLocationCheck: boolean;
}
