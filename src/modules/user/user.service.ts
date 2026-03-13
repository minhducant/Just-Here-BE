import mongoose, { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Cache, caching } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { GetUserDto } from './dto/get-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { UserRole, UserStatus } from 'src/shares/enums/user.enum';
import { UserGoogleInfoDto } from '../auth/dto/user-google-info.dto';
import { UserFacebookInfoDto } from '../auth/dto/user-facebook-info.dto';
import { httpErrors } from 'src/shares/exceptions';
import { USER_AUTH_CACHE_PREFIX } from '../auth/auth.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly activeUserFilter = { is_deleted: { $ne: true } };

  private ensureUserNotDeleted(
    user: UserDocument | null,
  ): UserDocument | null {
    if (user?.is_deleted) {
      throw new NotFoundException(httpErrors.ACCOUNT_NOT_FOUND);
    }

    return user;
  }

  async findById(_id: string): Promise<User> {
    return this.userModel
      .findOne({ _id, ...this.activeUserFilter })
      .lean()
      .exec();
  }

  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    const forbiddenFields = ['_id', 'user_id', 'role', 'status', 'created_at'];
    forbiddenFields.forEach((field) => delete (updateData as any)[field]);
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: id, ...this.activeUserFilter },
        {
          $set: {
            ...updateData,
            updated_at: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .lean()
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(httpErrors.ACCOUNT_NOT_FOUND);
    }
    return updatedUser;
  }

  generateUserId(): string {
    const uuid = uuidv4();
    const userId = uuid.substr(0, 8).toUpperCase();
    return userId;
  }

  async addFirebaseTokenPush(notification_token: string, _id: string) {
    await this.userModel.findOneAndUpdate(
      { _id },
      { notification_token: notification_token },
    );
  }

  async findOne(condition: GetUserDto, selectPassword = false): Promise<User> {
    if (selectPassword) {
      return this.userModel
        .findOne({ ...condition, ...this.activeUserFilter })
        .select('+password');
    }
    return this.userModel.findOne({ ...condition, ...this.activeUserFilter });
  }

  async findAll(
    getUsersDto: GetUsersDto,
    userId: string,
  ): Promise<ResPagingDto<User[]>> {
    const { sort, page, limit, name } = getUsersDto;
    const query: any = {
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
      ...this.activeUserFilter,
    };
    if (name) {
      query.$or = [{ name: { $regex: name, $options: 'i' } }];
    }
    const pipeline = [
      { $match: query },
      { $addFields: { selected: false } },
      {
        $sort: { createdAt: sort },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
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

  async findOrCreateFacebookUser(profile: UserFacebookInfoDto): Promise<User> {
    const user_id = this.generateUserId();
    const user = this.ensureUserNotDeleted(await this.userModel.findOne({
      facebook_id: profile.id,
    }));
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        {
          lastLoginAt: new Date(),
        },
        { new: true },
      );
    }
    return this.userModel.create({
      facebook_id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      user_id: user_id,
      image_url: profile.picture.data.url,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateGoogleUser(profile: UserGoogleInfoDto): Promise<User> {
    const { sub, picture, given_name, family_name, email } = profile;
    const user_id = this.generateUserId();
    const user = this.ensureUserNotDeleted(await this.userModel.findOne({
      google_id: sub,
    }));
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        {
          last_login_at: new Date(),
          email,
        },
        { new: true },
      );
    }
    return this.userModel.create({
      google_id: sub,
      name: `${given_name} ${family_name}`,
      user_id: user_id,
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
    const user = this.ensureUserNotDeleted(await this.userModel.findOne({
      zalo_id: id,
    }));
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        {
          last_login_at: new Date(),
        },
        { new: true },
      );
    }
    return this.userModel.create({
      zalo_id: id,
      name: name,
      user_id: user_id,
      image_url: picture.data.url,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateAppleUser(profile: any): Promise<User> {
    const { sub, email } = profile;
    const user_id = this.generateUserId();
    const existingUser = this.ensureUserNotDeleted(await this.userModel.findOne({
      apple_id: sub,
    }));
    if (existingUser) {
      return this.userModel.findByIdAndUpdate(
        existingUser._id,
        {
          last_login_at: new Date(),
          ...(email && { email }),
        },
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
    const user = this.ensureUserNotDeleted(await this.userModel.findOne({
      line_id: userId,
    }));
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        {
          last_login_at: new Date(),
        },
        { new: true },
      );
    }
    return this.userModel.create({
      line_id: userId,
      name: displayName,
      user_id: user_id,
      image_url: pictureUrl,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateXUser(profile: any): Promise<User> {
    const { name, id, profile_image_url_https } = profile;
    const user_id = this.generateUserId();
    const user = this.ensureUserNotDeleted(await this.userModel.findOne({
      x_id: id,
    }));
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        {
          last_login_at: new Date(),
        },
        { new: true },
      );
    }
    return this.userModel.create({
      x_id: id,
      name: name,
      user_id: user_id,
      image_url: profile_image_url_https,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async delete(id: string, requesterId: string): Promise<void> {
    if (id !== requesterId) {
      throw new ForbiddenException(httpErrors.FORBIDDEN);
    }
    const deletedUser = await this.userModel.findOneAndUpdate(
      { _id: id, ...this.activeUserFilter },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );
    if (!deletedUser) {
      throw new NotFoundException(httpErrors.ACCOUNT_NOT_FOUND);
    }
    await this.cacheManager.del(`${USER_AUTH_CACHE_PREFIX}${id}`);
  }
}
