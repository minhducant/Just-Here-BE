import mongoose, { Model } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';

import { User, UserDocument } from '@app/shared/schemas/user.schema';
import { Contact, ContactDocument } from '@app/shared/schemas/contact.schema';
import { ResPagingDto } from '@app/shared/dtos/pagination.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async find(getContactDto: any, user_id: string): Promise<ResPagingDto<Contact[]>> {
    const { sort, page, limit } = getContactDto;
    const query: any = {};
    if (user_id) {
      query.user_id = new mongoose.Types.ObjectId(user_id);
    }
    const pipeline = [
      { $match: query },
      { $sort: { createdAt: sort } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
    const [result, total] = await Promise.all([
      this.contactModel.aggregate(pipeline).exec(),
      this.contactModel.countDocuments(query),
    ]);
    return { result, total, lastPage: Math.ceil(total / limit) };
  }

  async create(payload: any, create_by: string): Promise<void> {
    await this.contactModel.create({ ...payload, user_id: create_by });
  }

  async update(payload: any, id: string, create_by: string): Promise<void> {
    const contact = await this.contactModel.findOne({ _id: id, user_id: create_by });
    if (!contact) {
      throw new BadRequestException('Contact not found');
    }
    await this.contactModel.updateOne({ _id: id, user_id: create_by }, { $set: { ...payload } });
  }

  async delete(id: string, user_id: string): Promise<void> {
    const contact = await this.contactModel.findOne({ _id: id, user_id });
    if (!contact) {
      throw new BadRequestException('Contact not found');
    }
    await this.contactModel.deleteOne({ _id: id, user_id });
  }
}
