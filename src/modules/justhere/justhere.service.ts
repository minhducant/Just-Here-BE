import { Queue } from 'bullmq';
import mongoose, { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';

import { GetJustHereDto } from './dto/get-justhere.dto';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { CreateJustHereDto } from './dto/create-justhere.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { JustHere, JustHereDocument } from './schemas/justhere.schema';

@Injectable()
export class JustHereService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectQueue(JUST_HERE_QUEUE) private readonly justHereQueue: Queue,
    @InjectModel(JustHere.name)
    private justhereModel: Model<JustHereDocument>,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkInactiveUsers(): Promise<void> {
    await this.runInactiveUserCheck(5);
  }

  async runInactiveUserCheck(days = 5): Promise<{ total: number }> {
    const targetStart = new Date();
    targetStart.setUTCDate(targetStart.getUTCDate() - days);
    targetStart.setUTCHours(0, 0, 0, 0);
    const targetEnd = new Date(targetStart);
    targetEnd.setUTCHours(23, 59, 59, 999);
    const users = await this.userModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'justhere',
          localField: '_id',
          foreignField: 'user_id',
          as: 'records',
        },
      },
      {
        $addFields: {
          lastJustHereDate: { $max: '$records.date' },
        },
      },
      {
        $match: {
          lastJustHereDate: {
            $gte: targetStart,
            $lte: targetEnd,
          },
        },
      },

      { $project: { _id: 1 } },
    ]);
    if (!users.length) return { total: 0 };
    await this.justHereQueue.addBulk(
      users.map((u) => ({
        name: 'send-warning',
        data: {
          userId: u._id.toString(),
          days,
        },
        opts: {
          removeOnComplete: true,
          attempts: 3,
        },
      })),
    );
    return { total: users.length };
  }

  async find(
    getNoteDto: GetJustHereDto,
    user_id: string,
  ): Promise<ResPagingDto<JustHere[]>> {
    const { sort, page, limit } = getNoteDto;
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
      this.justhereModel.aggregate(pipeline).exec(),
      this.justhereModel.countDocuments(query),
    ]);
    return {
      result,
      total,
      lastPage: Math.ceil(total / limit),
    };
  }

  async create(payload: CreateJustHereDto, create_by: string): Promise<void> {
    await this.justhereModel.create({
      ...payload,
      user_id: create_by,
    });
  }

  async findToday(user_id: string): Promise<JustHere | null> {
    if (!user_id) {
      throw new BadRequestException('User id is required');
    }
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    return this.justhereModel.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
      date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });
  }
}
