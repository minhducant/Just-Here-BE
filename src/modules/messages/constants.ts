import { Types } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  POLL = 'poll',
}

export enum ReceiptStatus {
  SENT = 'SENT',
  SEEN = 'SEEN',
  DELIVERED = 'DELIVERED',
}

export interface Receipt {
  user: Types.ObjectId;
  status: ReceiptStatus;
  updatedAt?: Date;
}
