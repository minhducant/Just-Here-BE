import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { USER_MODEL } from '@app/shared/schemas/user.schema';

export const CONTACT_MODEL = 'contact';

@Schema({ timestamps: true, collection: CONTACT_MODEL })
export class Contact extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: USER_MODEL, index: true })
  user_id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, index: true })
  email: string;

  @Prop({ type: String })
  country_code: string;

  @Prop({ type: String, index: true })
  phone_number: string;
}

export type ContactDocument = Contact & Document;

export const ContactSchema = SchemaFactory.createForClass(Contact);
