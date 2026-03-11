import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { UserStatus } from 'src/shares/enums/user.enum';

export const USER_MODEL = 'user';
@Schema({ timestamps: true, collection: USER_MODEL })
export class User {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, unique: true })
  user_id: string;

  @Prop({ type: String })
  full_name: string;

  @Prop({ type: String, index: true })
  phone: string;

  @Prop({ type: Date })
  birthday: Date;

  @Prop({ type: String, index: true })
  email: string;

  @Prop({ type: Number })
  gender: number;

  @Prop({ type: Boolean, default: false })
  is_banned: boolean;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.INACTIVE })
  status: UserStatus;

  @Prop({ type: String, unique: true, sparse: true })
  facebook_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  google_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  zalo_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  apple_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  line_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  kakao_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  x_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  whatsapp_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  wechat_id: string;

  @Prop({ type: String, unique: true, sparse: true })
  snapchat_id: string;

  @Prop({ type: Date })
  last_login_at: Date;

  @Prop({ required: false, type: String })
  image_url: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Date })
  deleted_at?: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
