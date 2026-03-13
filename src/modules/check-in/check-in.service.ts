import { Queue } from 'bullmq';
import mongoose, { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';

import { GetCheckinDto } from './dto/get-check-in.dto';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { CreateCheckinDto } from './dto/create-check-in.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { Checkin, CheckinDocument } from './schemas/check-in.schema';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectQueue(JUST_HERE_QUEUE) private readonly justHereQueue: Queue,
    @InjectModel(Checkin.name)
    private checkinModel: Model<CheckinDocument>,
  ) {}

  /**
   * Runs every hour at :00.
   * Finds all active users whose local check-in hour (checkin_time) matches
   * the current UTC hour, accounting for each user's time_zone offset,
   * and queues a check-in reminder notification for each of them.
   */
  @Cron('0 * * * *')
  async sendCheckinReminders(): Promise<void> {
    await this.runCheckinReminders();
  }

  async runCheckinReminders(): Promise<{ total: number }> {
    const currentUTCHour = new Date().getUTCHours();
    const users = await this.userModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $match: {
          $expr: {
            $eq: [
              '$checkin_time',
              {
                $mod: [
                  { $add: [{ $add: [currentUTCHour, '$time_zone'] }, 24] },
                  24,
                ],
              },
            ],
          },
        },
      },
      { $project: { _id: 1 } },
    ]);
    if (!users.length) return { total: 0 };
    await this.justHereQueue.addBulk(
      users.map((u) => ({
        name: 'send-checkin-reminder',
        data: { userId: u._id.toString() },
        opts: { removeOnComplete: true, attempts: 3 },
      })),
    );
    return { total: users.length };
  }

  /**
   * Runs every day at 9 AM UTC.
   * Finds all active users whose last check-in was exactly their configured
   * grace_period days ago and queues a warning notification + contact emails.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkInactiveUsers(): Promise<void> {
    await this.runGracePeriodCheck();
  }

  async runGracePeriodCheck(): Promise<{ total: number }> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const users = await this.userModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'check_ins',
          localField: '_id',
          foreignField: 'user_id',
          as: 'records',
        },
      },
      {
        $addFields: {
          lastCheckinDate: { $max: '$records.date' },
        },
      },
      {
        $addFields: {
          lastCheckinDayStart: {
            $cond: [
              { $gt: ['$lastCheckinDate', null] },
              {
                $dateFromParts: {
                  year: { $year: '$lastCheckinDate' },
                  month: { $month: '$lastCheckinDate' },
                  day: { $dayOfMonth: '$lastCheckinDate' },
                },
              },
              null,
            ],
          },
        },
      },
      {
        $addFields: {
          daysSinceLastCheckin: {
            $cond: [
              { $gt: ['$lastCheckinDayStart', null] },
              {
                $divide: [
                  { $subtract: [todayStart, '$lastCheckinDayStart'] },
                  86400000,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $gt: ['$daysSinceLastCheckin', null] },
              { $eq: ['$daysSinceLastCheckin', '$grace_period'] },
            ],
          },
        },
      },
      { $project: { _id: 1, grace_period: 1 } },
    ]);
    if (!users.length) return { total: 0 };
    await this.justHereQueue.addBulk(
      users.map((u) => ({
        name: 'send-warning',
        opts: { removeOnComplete: true, attempts: 3 },
        data: { userId: u._id.toString(), days: u.grace_period },
      })),
    );
    return { total: users.length };
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
          from: 'check_ins',
          localField: '_id',
          foreignField: 'user_id',
          as: 'records',
        },
      },
      {
        $addFields: {
          lastCheckinDate: { $max: '$records.date' },
        },
      },
      {
        $match: {
          lastCheckinDate: {
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
    getNoteDto: GetCheckinDto,
    user_id: string,
  ): Promise<ResPagingDto<Checkin[]>> {
    const { sort, page, limit, from_date, to_date, type } = getNoteDto;
    const query: any = {};
    if (user_id) {
      query.user_id = new mongoose.Types.ObjectId(user_id);
    }
    if (from_date || to_date) {
      query.date = {};
      if (from_date) {
        query.date.$gte = new Date(from_date);
      }
      if (to_date) {
        query.date.$lte = new Date(to_date);
      }
    }
    if (type) {
      query.type = type;
    }
    const pipeline = [
      { $match: query },
      { $sort: { date: sort, createdAt: sort } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
    const [result, total] = await Promise.all([
      this.checkinModel.aggregate(pipeline).exec(),
      this.checkinModel.countDocuments(query),
    ]);
    return {
      result,
      total,
      lastPage: Math.ceil(total / limit),
    };
  }

  async create(payload: CreateCheckinDto, create_by: string): Promise<void> {
    await this.checkinModel.create({
      ...payload,
      user_id: create_by,
    });
  }

  async update(payload: CreateCheckinDto, create_by: string): Promise<void> {
    const { date } = payload;
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    await this.checkinModel.updateOne(
      {
        user_id: new mongoose.Types.ObjectId(create_by),
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
      { $set: { ...payload } },
      { upsert: true },
    );
  }

  async findToday(user_id: string): Promise<Checkin | null> {
    if (!user_id) {
      throw new BadRequestException('User id is required');
    }
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    return this.checkinModel.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
      date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });
  }
}
