import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MSchema } from 'mongoose';

import { MessageType } from '../constants';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class PollOption {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  votes: Types.ObjectId[];
}

export const PollOptionSchema = SchemaFactory.createForClass(PollOption);

@Schema()
export class Receipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['SENT', 'DELIVERED', 'SEEN'],
    default: 'SENT',
  })
  status: string;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(MessageType) })
  type: string;

  @Prop()
  content?: string;

  @Prop({
    type: [{ filename: String, url: String, mime: String, size: Number }],
    default: [],
  })
  attachments?: {
    filename: string;
    url: string;
    mime: string;
    size: number;
  }[];

  @Prop({ type: [PollOptionSchema], default: [] })
  pollOptions?: PollOption[];

  @Prop({ type: [ReceiptSchema], default: [] })
  receipts?: Receipt[];

  @Prop({ default: false })
  edited?: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
