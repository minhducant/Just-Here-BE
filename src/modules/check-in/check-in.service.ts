import { Queue } from 'bullmq';
import mongoose, { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';

import { GetCheckinDto } from './dto/get-check-in.dto';
import { CheckinType, MoodValue } from './check-in.enum';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { CreateCheckinDto } from './dto/create-check-in.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { Checkin, CheckinDocument } from './schemas/check-in.schema';

export type CheckinPagingResponse = ResPagingDto<Checkin[]> & {
  currentCheckinStreak: number;
  longestCheckinStreak: number;
};

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
  ): Promise<CheckinPagingResponse> {
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
    const [result, total, streaks] = await Promise.all([
      this.checkinModel.aggregate(pipeline).exec(),
      this.checkinModel.countDocuments(query),
      this.getCheckinStreaks(user_id, type),
    ]);
    return {
      result,
      total,
      lastPage: Math.ceil(total / limit),
      ...streaks,
    };
  }

  async create(payload: CreateCheckinDto, create_by: string): Promise<void> {
    const { user_id: _ignoredUserId, ...safePayload } = payload;
    await this.checkinModel.create({
      ...safePayload,
      user_id: create_by,
    });
  }

  async update(payload: CreateCheckinDto, create_by: string): Promise<void> {
    const { user_id: _ignoredUserId, ...safePayload } = payload;
    const { date } = safePayload;
    const timezoneOffsetMinutes = await this.getUserTimezoneOffsetMinutes(
      create_by,
    );
    const { start: startOfDay, end: endOfDay } = this.getUtcDayRangeAtOffset(
      date,
      timezoneOffsetMinutes,
    );
    await this.checkinModel.updateOne(
      {
        user_id: new mongoose.Types.ObjectId(create_by),
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
      { $set: { ...safePayload } },
      { upsert: true },
    );
  }

  async deleteAll(user_id: string): Promise<{ deletedCount: number }> {
    if (!user_id) {
      throw new BadRequestException('User id is required');
    }
    const result = await this.checkinModel.deleteMany({
      user_id: new mongoose.Types.ObjectId(user_id),
    });
    return {
      deletedCount: result.deletedCount ?? 0,
    };
  }

  async findToday(user_id: string): Promise<Checkin | null> {
    if (!user_id) {
      throw new BadRequestException('User id is required');
    }
    const timezoneOffsetMinutes =
      await this.getUserTimezoneOffsetMinutes(user_id);
    const { start: startOfToday, end: endOfToday } = this.getUtcDayRangeAtOffset(
      new Date(),
      timezoneOffsetMinutes,
    );
    return this.checkinModel.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
      date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });
  }

  async seedFakeDailyCheckins(user_id: string): Promise<{ total: number }> {
    if (!user_id) {
      throw new BadRequestException('User id is required');
    }
    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const moodValues = Object.values(MoodValue);
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setUTCMonth(startDate.getUTCMonth() - 3);
    const operations: mongoose.AnyBulkWriteOperation<CheckinDocument>[] = [];
    for (
      const cursor = new Date(startDate);
      cursor <= today;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const checkinDate = new Date(cursor);
      checkinDate.setUTCHours(12, 0, 0, 0);
      const startOfDay = new Date(checkinDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(checkinDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      const randomMood =
        moodValues[Math.floor(Math.random() * moodValues.length)];
      operations.push({
        updateOne: {
          filter: {
            user_id: userObjectId,
            type: CheckinType.DAILY,
            date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
          update: {
            $set: {
              user_id,
              date: checkinDate,
              type: CheckinType.DAILY,
              mood: randomMood,
            },
          },
          upsert: true,
        },
      });
    }
    if (!operations.length) {
      return { total: 0 };
    }
    await this.checkinModel.bulkWrite(operations);
    return { total: operations.length };
  }

  private async getCheckinStreaks(
    user_id: string,
    type?: CheckinType,
  ): Promise<Pick<CheckinPagingResponse, 'currentCheckinStreak' | 'longestCheckinStreak'>> {
    if (!user_id) {
      return {
        currentCheckinStreak: 0,
        longestCheckinStreak: 0,
      };
    }
    const matchQuery: {
      user_id: mongoose.Types.ObjectId;
      type?: CheckinType;
    } = {
      user_id: new mongoose.Types.ObjectId(user_id),
    };
    if (type) {
      matchQuery.type = type;
    }
    const timezoneOffsetMinutes = await this.getUserTimezoneOffsetMinutes(
      user_id,
    );
    const timezone = this.toMongoTimezoneOffset(timezoneOffsetMinutes);
    const groupedDates = await this.checkinModel.aggregate<{ _id: string }>([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
              timezone,
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return this.calculateCheckinStreaks(
      groupedDates.map((item) => item._id),
      timezoneOffsetMinutes,
    );
  }

  private calculateCheckinStreaks(
    dateKeys: string[],
    timezoneOffsetMinutes: number,
  ): Pick<CheckinPagingResponse, 'currentCheckinStreak' | 'longestCheckinStreak'> {
    if (!dateKeys.length) {
      return {
        currentCheckinStreak: 0,
        longestCheckinStreak: 0,
      };
    }
    let longestCheckinStreak = 1;
    let runningStreak = 1;
    for (let index = 1; index < dateKeys.length; index += 1) {
      const previousDay = this.toUTCUnixDay(dateKeys[index - 1]);
      const currentDay = this.toUTCUnixDay(dateKeys[index]);
      if (currentDay - previousDay === 1) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
      if (runningStreak > longestCheckinStreak) {
        longestCheckinStreak = runningStreak;
      }
    }
    const todayKey = this.toDateKeyAtOffset(new Date(), timezoneOffsetMinutes);
    const lastCheckinKey = dateKeys[dateKeys.length - 1];
    const currentCheckinStreak = lastCheckinKey === todayKey ? runningStreak : 0;
    return {
      currentCheckinStreak,
      longestCheckinStreak,
    };
  }

  private toUTCUnixDay(dateKey: string): number {
    return Math.floor(Date.parse(`${dateKey}T00:00:00.000Z`) / 86400000);
  }

  private toDateKeyAtOffset(date: Date, timezoneOffsetMinutes: number): string {
    return new Date(date.getTime() + timezoneOffsetMinutes * 60000)
      .toISOString()
      .slice(0, 10);
  }

  private getUtcDayRangeAtOffset(
    date: Date,
    timezoneOffsetMinutes: number,
  ): { start: Date; end: Date } {
    const shiftedDate = new Date(date.getTime() + timezoneOffsetMinutes * 60000);
    const year = shiftedDate.getUTCFullYear();
    const month = shiftedDate.getUTCMonth();
    const day = shiftedDate.getUTCDate();

    const startUtcMs =
      Date.UTC(year, month, day, 0, 0, 0, 0) - timezoneOffsetMinutes * 60000;
    const endUtcMs =
      Date.UTC(year, month, day, 23, 59, 59, 999) -
      timezoneOffsetMinutes * 60000;

    return {
      start: new Date(startUtcMs),
      end: new Date(endUtcMs),
    };
  }

  private async getUserTimezoneOffsetMinutes(userId: string): Promise<number> {
    const user = await this.userModel
      .findById(userId, { time_zone: 1 })
      .lean<{ time_zone?: number }>();
    const timezoneHours =
      typeof user?.time_zone === 'number' && Number.isFinite(user.time_zone)
        ? user.time_zone
        : 7;
    return Math.round(timezoneHours * 60);
  }

  private toMongoTimezoneOffset(timezoneOffsetMinutes: number): string {
    const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
    const absoluteMinutes = Math.abs(timezoneOffsetMinutes);
    const hours = Math.floor(absoluteMinutes / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (absoluteMinutes % 60).toString().padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
  }
}
