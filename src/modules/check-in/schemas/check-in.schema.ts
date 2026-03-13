import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { USER_MODEL } from 'src/modules/user/schemas/user.schema';
import {
  MoodValue,
  CheckinType,
} from 'src/modules/check-in/check-in.enum';

export const CHECK_IN_MODEL = 'check_ins';
@Schema({ timestamps: true, collection: CHECK_IN_MODEL })
export class Checkin extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: USER_MODEL })
  user_id: string;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({
    type: String,
    enum: CheckinType,
    default: CheckinType.DAILY,
    index: true,
  })
  type: CheckinType;

  @Prop({ type: String, enum: MoodValue, required: true, index: true })
  mood: MoodValue;

  @Prop({ type: Number, min: -90, max: 90 })
  latitude?: number;

  @Prop({ type: Number, min: -180, max: 180 })
  longitude?: number;

  @Prop({ type: String, maxlength: 500 })
  image_url?: string;

  @Prop({ type: String, maxlength: 200 })
  note?: string;
}

export type CheckinDocument = Checkin & Document;

export const CheckinSchema = SchemaFactory.createForClass(Checkin);

CheckinSchema.index({ user_id: 1, date: 1, type: 1 }, { unique: true });

CheckinSchema.pre('validate', function (next) {
  if (this.type === 'travel') {
    if (
      typeof this.latitude !== 'number' ||
      typeof this.longitude !== 'number'
    ) {
      return next(new Error('Travel type requires latitude and longitude'));
    }
  }
  next();
});
