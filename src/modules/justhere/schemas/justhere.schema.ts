import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { USER_MODEL } from 'src/modules/user/schemas/user.schema';
import {
  EmotionValue,
  JustHereType,
} from 'src/modules/justhere/justhere.enum';

export const JUST_HERE_MODEL = 'justhere';
@Schema({ timestamps: true, collection: JUST_HERE_MODEL })
export class JustHere extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: USER_MODEL })
  user_id: string;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({
    type: String,
    enum: JustHereType,
    default: JustHereType.DAILY,
    index: true,
  })
  type: JustHereType;

  @Prop({ type: String, enum: EmotionValue, required: true, index: true })
  emotion: EmotionValue;

  @Prop({ type: Number, min: -90, max: 90 })
  latitude?: number;

  @Prop({ type: Number, min: -180, max: 180 })
  longitude?: number;

  @Prop({ type: String, maxlength: 500 })
  image_url?: string;

  @Prop({ type: String, maxlength: 200 })
  note?: string;
}

export type JustHereDocument = JustHere & Document;

export const JustHereSchema = SchemaFactory.createForClass(JustHere);

JustHereSchema.index({ user_id: 1, date: 1, type: 1 }, { unique: true });

JustHereSchema.pre('validate', function (next) {
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
