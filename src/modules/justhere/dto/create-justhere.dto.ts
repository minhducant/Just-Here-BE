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
} from 'class-validator';

import {
  EmotionValue,
  JustHereType,
} from 'src/modules/justhere/justhere.enum';

@ValidatorConstraint({ name: 'TravelLocationRequired', async: false })
export class TravelLocationRequired implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const dto = args.object as any;
    if (dto.type === JustHereType.TRAVEL) {
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

export class CreateJustHereDto {
  @ApiProperty({})
  @IsMongoId()
  user_id: string;

  @ApiProperty({
    example: new Date(),
    type: String,
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    enum: JustHereType,
    default: JustHereType.DAILY,
  })
  @IsOptional()
  @IsEnum(JustHereType)
  type?: JustHereType = JustHereType.DAILY;

  @ApiProperty({
    enum: EmotionValue,
    example: EmotionValue.STRESSED,
  })
  @IsEnum(EmotionValue)
  emotion: EmotionValue;

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
  note?: string;

  @Validate(TravelLocationRequired)
  private readonly _travelLocationCheck: boolean;
}
