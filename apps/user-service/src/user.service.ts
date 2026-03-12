import mongoose, { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { User, UserDocument } from '@app/shared/schemas/user.schema';
import { ResPagingDto } from '@app/shared/dtos/pagination.dto';
import { UserRole, UserStatus } from '@app/shared/enums/user.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findById(_id: string): Promise<User> {
    return this.userModel.findById(_id).lean().exec();
  }

  async findOne(condition: any): Promise<User> {
    return this.userModel.findOne(condition);
  }

  async update(id: string, updateData: any): Promise<User> {
    const forbiddenFields = ['_id', 'user_id', 'role', 'status', 'created_at'];
    forbiddenFields.forEach((field) => delete updateData[field]);
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { ...updateData, updated_at: new Date() } },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  generateUserId(): string {
    const uuid = uuidv4();
    return uuid.slice(0, 8).toUpperCase();
  }

  async findAll(getUsersDto: any, userId: string): Promise<ResPagingDto<User[]>> {
    const { sort, page, limit, name } = getUsersDto;
    const query: any = { _id: { $ne: new mongoose.Types.ObjectId(userId) } };
    if (name) {
      query.$or = [{ name: { $regex: name, $options: 'i' } }];
    }
    const pipeline = [
      { $match: query },
      { $addFields: { selected: false } },
      { $sort: { createdAt: sort } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
    const [result, total] = await Promise.all([
      this.userModel.aggregate(pipeline).exec(),
      this.userModel.countDocuments(query),
    ]);
    return {
      result,
      total,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOrCreateFacebookUser(profile: any): Promise<User> {
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ facebook_id: profile.id });
    if (user) {
      return this.userModel.findByIdAndUpdate(user._id, { last_login_at: new Date() }, { new: true });
    }
    return this.userModel.create({
      facebook_id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      user_id,
      image_url: profile.picture?.data?.url,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    const { sub, picture, given_name, family_name, email } = profile;
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ google_id: sub });
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        { last_login_at: new Date(), email },
        { new: true },
      );
    }
    return this.userModel.create({
      google_id: sub,
      name: `${given_name} ${family_name}`,
      user_id,
      image_url: picture,
      role: UserRole.user,
      last_login_at: new Date(),
      email,
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateZaloUser(profile: any): Promise<User> {
    const { name, id, picture } = profile;
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ zalo_id: id });
    if (user) {
      return this.userModel.findByIdAndUpdate(user._id, { last_login_at: new Date() }, { new: true });
    }
    return this.userModel.create({
      zalo_id: id,
      name,
      user_id,
      image_url: picture?.data?.url,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateAppleUser(profile: any): Promise<User> {
    const { sub, email } = profile;
    const user_id = this.generateUserId();
    const existingUser = await this.userModel.findOne({ apple_id: sub });
    if (existingUser) {
      return this.userModel.findByIdAndUpdate(
        existingUser._id,
        { last_login_at: new Date(), ...(email && { email }) },
        { new: true },
      );
    }
    return this.userModel.create({
      apple_id: sub,
      user_id,
      name: email ? email.split('@')[0] : `AppleUser_${user_id}`,
      email: email ?? null,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateLINEUser(profile: any): Promise<User> {
    const { displayName, userId, pictureUrl } = profile;
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ line_id: userId });
    if (user) {
      return this.userModel.findByIdAndUpdate(user._id, { last_login_at: new Date() }, { new: true });
    }
    return this.userModel.create({
      line_id: userId,
      name: displayName,
      user_id,
      image_url: pictureUrl,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      is_deleted: true,
      deleted_at: new Date(),
    });
  }
}
