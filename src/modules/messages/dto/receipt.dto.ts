import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsEnum } from 'class-validator';

export enum ReceiptStatusDto {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  SEEN = 'SEEN',
}

export class UpdateReceiptDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: ReceiptStatusDto })
  @IsEnum(ReceiptStatusDto)
  status: ReceiptStatusDto;
}
