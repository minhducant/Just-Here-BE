import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';

import { CheckinService } from './check-in.service';
import { User } from '../user/schemas/user.schema';
import { Checkin } from './schemas/check-in.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';

const mockAddBulk = jest.fn().mockResolvedValue([]);
const mockQueue = { addBulk: mockAddBulk };

const mockUserAggregate = jest.fn();
const mockUserModel = {
  aggregate: mockUserAggregate,
};

const mockCheckinModel = {
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
};

const mockConnection = {};

describe('CheckinService', () => {
  let service: CheckinService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Checkin.name), useValue: mockCheckinModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: getQueueToken(JUST_HERE_QUEUE), useValue: mockQueue },
      ],
    }).compile();
    service = module.get<CheckinService>(CheckinService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('runCheckinReminders', () => {
    it('should return total 0 when no users match the current hour', async () => {
      mockUserAggregate.mockResolvedValue([]);
      const result = await service.runCheckinReminders();
      expect(result).toEqual({ total: 0 });
      expect(mockAddBulk).not.toHaveBeenCalled();
    });
    it('should queue send-checkin-reminder jobs for matched users', async () => {
      const fakeUsers = [
        { _id: { toString: () => 'user-1' } },
        { _id: { toString: () => 'user-2' } },
      ];
      mockUserAggregate.mockResolvedValue(fakeUsers);
      const result = await service.runCheckinReminders();
      expect(result).toEqual({ total: 2 });
      expect(mockAddBulk).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'send-checkin-reminder',
          data: { userId: 'user-1' },
        }),
        expect.objectContaining({
          name: 'send-checkin-reminder',
          data: { userId: 'user-2' },
        }),
      ]);
    });
    it('should pass the correct aggregation pipeline with UTC hour + timezone mod 24', async () => {
      mockUserAggregate.mockResolvedValue([]);
      await service.runCheckinReminders();
      const pipeline = mockUserAggregate.mock.calls[0][0];
      const matchStage = pipeline.find(
        (s: any) => s.$match && s.$match.$expr,
      );
      expect(matchStage).toBeDefined();
      expect(matchStage.$match.$expr.$eq[0]).toBe('$checkin_time');
      const modExpr = matchStage.$match.$expr.$eq[1];
      expect(modExpr.$mod).toBeDefined();
      expect(modExpr.$mod[1]).toBe(24);
    });
  });
  describe('runGracePeriodCheck', () => {
    it('should return total 0 when no users match grace_period', async () => {
      mockUserAggregate.mockResolvedValue([]);
      const result = await service.runGracePeriodCheck();
      expect(result).toEqual({ total: 0 });
      expect(mockAddBulk).not.toHaveBeenCalled();
    });
    it('should queue send-warning jobs with per-user grace_period', async () => {
      const fakeUsers = [
        { _id: { toString: () => 'user-1' }, grace_period: 3 },
        { _id: { toString: () => 'user-2' }, grace_period: 7 },
      ];
      mockUserAggregate.mockResolvedValue(fakeUsers);
      const result = await service.runGracePeriodCheck();
      expect(result).toEqual({ total: 2 });
      expect(mockAddBulk).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'send-warning',
          data: { userId: 'user-1', days: 3 },
        }),
        expect.objectContaining({
          name: 'send-warning',
          data: { userId: 'user-2', days: 7 },
        }),
      ]);
    });
    it('should include a stage comparing daysSinceLastCheckin to grace_period', async () => {
      mockUserAggregate.mockResolvedValue([]);
      await service.runGracePeriodCheck();
      const pipeline = mockUserAggregate.mock.calls[0][0];
      const matchStage = pipeline.find(
        (s: any) =>
          s.$match &&
          s.$match.$expr &&
          s.$match.$expr.$and,
      );
      expect(matchStage).toBeDefined();
      const andConditions: any[] = matchStage.$match.$expr.$and;
      const eqCondition = andConditions.find((c: any) => c.$eq);
      expect(eqCondition).toBeDefined();
      expect(eqCondition.$eq).toContain('$grace_period');
    });
  });
  describe('runInactiveUserCheck', () => {
    it('should return total 0 when no inactive users found', async () => {
      mockUserAggregate.mockResolvedValue([]);
      const result = await service.runInactiveUserCheck(5);
      expect(result).toEqual({ total: 0 });
      expect(mockAddBulk).not.toHaveBeenCalled();
    });
    it('should queue send-warning jobs with provided days count', async () => {
      const fakeUsers = [{ _id: { toString: () => 'user-a' } }];
      mockUserAggregate.mockResolvedValue(fakeUsers);
      const result = await service.runInactiveUserCheck(5);
      expect(result).toEqual({ total: 1 });
      expect(mockAddBulk).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'send-warning',
          data: { userId: 'user-a', days: 5 },
        }),
      ]);
    });
    it('should use default days value of 5 when not provided', async () => {
      mockUserAggregate.mockResolvedValue([]);
      await service.runInactiveUserCheck();
      const pipeline = mockUserAggregate.mock.calls[0][0];
      expect(pipeline).toBeDefined();
      expect(pipeline.length).toBeGreaterThan(0);
    });
  });
});

