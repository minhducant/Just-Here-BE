// src/modules/messages/messages.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ReceiptStatus } from './constants';
import { VotePollDto } from './dto/vote-poll.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message, MessageDocument } from './schemas/message.schema';

export type MessageLean = {
  _id: string;
  author: string | Types.ObjectId;
  type: string;
  content?: string;
  attachments?: {
    filename: string;
    url: string;
    mime?: string;
    size?: number;
  }[];
  pollOptions?: Array<{
    text: string;
    votes: (string | Types.ObjectId)[];
  }>;
  receipts?: Array<{
    user: string | Types.ObjectId;
    status: string;
    updatedAt?: Date;
  }>;
  edited?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, any>;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(
    dto: CreateMessageDto,
    attachments: {
      filename: string;
      url: string;
      mime: string;
      size: number;
    }[] = [],
  ): Promise<MessageDocument> {
    try {
      const msg: Partial<Message> = {
        author: new Types.ObjectId(dto.author),
        type: dto.type,
        content: dto.content,
        attachments,
        receipts: [],
      };
      if (dto.type === 'poll') {
        if (!dto.pollOptions || dto.pollOptions.length < 2) {
          throw new BadRequestException('Poll must have at least 2 options');
        }
        msg.pollOptions = dto.pollOptions.map((opt) => ({
          text: opt,
          votes: [],
        }));
      }

      const created = new this.messageModel(msg);
      return await created.save();
    } catch (err) {
      throw new InternalServerErrorException('Failed to create message');
    }
  }

  async findRecent(limit = 50): Promise<MessageLean[]> {
    return this.messageModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<MessageLean[]>()
      .exec();
  }

  async findPaginated(options: PaginationOptions = {}): Promise<{
    items: MessageLean[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;
    const sort = options.sort ?? { createdAt: -1 };
    const filter = options.filter ?? {};

    try {
      const [total, items] = await Promise.all([
        this.messageModel.countDocuments(filter).exec(),
        this.messageModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<MessageLean[]>()
          .exec(),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async findAll(): Promise<MessageLean[]> {
    return this.messageModel
      .find()
      .sort({ createdAt: 1 })
      .lean<MessageLean[]>()
      .exec();
  }

  async findById(id: string): Promise<MessageLean> {
    const msg = await this.messageModel.findById(id).lean<MessageLean>().exec();
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    return msg;
  }

  async update(
    id: string,
    patch: Partial<UpdateMessageDto>,
  ): Promise<MessageDocument> {
    const updated = await this.messageModel
      .findByIdAndUpdate(
        id,
        { ...patch, edited: true },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) throw new NotFoundException(`Message ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.messageModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException(`Message ${id} not found`);
    return { deleted: true };
  }

  async initReceipts(messageId: string, recipientIds: string[]): Promise<void> {
    const receipts = recipientIds.map((id) => ({
      user: new Types.ObjectId(id),
      status: ReceiptStatus.SENT,
      updatedAt: new Date(),
    }));
    await this.messageModel
      .findByIdAndUpdate(messageId, { $set: { receipts } })
      .exec();
  }

  async markDelivered(messageId: string, userId: string): Promise<void> {
    await this.updateReceiptStatus(messageId, userId, ReceiptStatus.DELIVERED);
  }

  async markSeen(messageId: string, userId: string): Promise<void> {
    await this.updateReceiptStatus(messageId, userId, ReceiptStatus.SEEN);
  }

  private async updateReceiptStatus(
    messageId: string,
    userId: string,
    status: ReceiptStatus,
  ) {
    const res = await this.messageModel
      .findOneAndUpdate(
        { _id: messageId, 'receipts.user': new Types.ObjectId(userId) },
        {
          $set: {
            'receipts.$.status': status,
            'receipts.$.updatedAt': new Date(),
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!res) {
      await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            $push: {
              receipts: {
                user: new Types.ObjectId(userId),
                status,
                updatedAt: new Date(),
              },
            },
          },
          { new: true },
        )
        .exec();
    }
  }

  async votePoll(
    messageId: string,
    dto: VotePollDto,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    if (message.type !== 'poll')
      throw new BadRequestException('Message is not a poll');
    const option = message.pollOptions?.[dto.optionIndex];
    if (!option) throw new BadRequestException('Invalid option index');
    const userObj = new Types.ObjectId(dto.userId);
    if (Array.isArray(message.pollOptions)) {
      for (const opt of message.pollOptions) {
        if (Array.isArray(opt.votes)) {
          const idx = opt.votes.findIndex((u: Types.ObjectId) =>
            u.equals(userObj),
          );
          if (idx !== -1) opt.votes.splice(idx, 1);
        }
      }
    }
    option.votes.push(userObj);
    await message.save();
    return message;
  }
}
