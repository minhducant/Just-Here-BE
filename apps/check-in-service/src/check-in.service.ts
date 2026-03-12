import { Queue } from 'bullmq';
import mongoose, { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';

import { User, UserDocument } from '@app/shared/schemas/user.schema';
import { Checkin, CheckinDocument } from '@app/shared/schemas/check-in.schema';
import { JUST_HERE_QUEUE } from '@app/shared/queue/justhere.queue';
import { ResPagingDto } from '@app/shared/dtos/pagination.dto';

@Injectable()
export class CheckInService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectQueue(JUST_HERE_QUEUE) private readonly justHereQueue: Queue,
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
  ) {}

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
              { $mod: [{ $add: [{ $add: [currentUTCHour, '$time_zone'] }, 24] }, 24] },
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
      { $addFields: { lastCheckinDate: { $max: '$records.date' } } },
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
              { $divide: [{ $subtract: [todayStart, '$lastCheckinDayStart'] }, 86400000] },
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
      { $addFields: { lastCheckinDate: { $max: '$records.date' } } },
      { $match: { lastCheckinDate: { $gte: targetStart, $lte: targetEnd } } },
      { $project: { _id: 1 } },
    ]);
    if (!users.length) return { total: 0 };
    await this.justHereQueue.addBulk(
      users.map((u) => ({
        name: 'send-warning',
        data: { userId: u._id.toString(), days },
        opts: { removeOnComplete: true, attempts: 3 },
      })),
    );
    return { total: users.length };
  }

  async find(getCheckinDto: any, user_id: string): Promise<ResPagingDto<Checkin[]>> {
    const { sort, page, limit } = getCheckinDto;
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
      this.checkinModel.aggregate(pipeline).exec(),
      this.checkinModel.countDocuments(query),
    ]);
    return { result, total, lastPage: Math.ceil(total / limit) };
  }

  async create(payload: any, create_by: string): Promise<void> {
    await this.checkinModel.create({ ...payload, user_id: create_by });
  }

  async update(payload: any, create_by: string): Promise<void> {
    const { date } = payload;
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    await this.checkinModel.updateOne(
      { user_id: new mongoose.Types.ObjectId(create_by), date: { $gte: startOfDay, $lte: endOfDay } },
      { $set: { ...payload } },
      { upsert: true },
    );
  }
}
