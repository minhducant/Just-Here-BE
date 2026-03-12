import { Job } from 'bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { CheckinProcessor } from './check-in.processor';
import { User } from '../user/schemas/user.schema';
import { Contact } from '../contact/schemas/contact.schema';
import { NotificationService } from '../notification/notification.service';
import { MailService } from 'src/modules/mail/mail.service';

const mockSendNotification = jest.fn().mockResolvedValue(undefined);
const mockNotificationService = { sendNotification: mockSendNotification };

const mockSendHtmlMail = jest.fn().mockResolvedValue(undefined);
const mockMailService = { sendHtmlMail: mockSendHtmlMail };

const mockUserFindById = jest.fn();
const mockUserModel = {
  findById: mockUserFindById,
};

const mockContactFind = jest.fn();
const mockContactModel = {
  find: mockContactFind,
};

describe('CheckinProcessor', () => {
  let processor: CheckinProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinProcessor,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    processor = module.get<CheckinProcessor>(CheckinProcessor);

    // Default mock behaviors reset after each jest.resetAllMocks()
    mockSendNotification.mockResolvedValue(undefined);
    mockSendHtmlMail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should handle send-checkin-reminder job', async () => {
      const job = { name: 'send-checkin-reminder', data: { userId: 'user-1' } } as Job;
      await processor.process(job);

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          title: 'Time to check in!',
        }),
      );
    });

    it('should handle send-warning job', async () => {
      const contacts = [
        { _id: 'c1', name: 'Alice', email: 'alice@example.com', user_id: 'user-1' },
      ];
      mockUserFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'John', full_name: 'John Doe' }) });
      mockContactFind.mockResolvedValue(contacts);

      const job = { name: 'send-warning', data: { userId: 'user-1', days: 5 } } as Job;
      await processor.process(job);

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          title: 'We miss you!',
        }),
      );
      expect(mockSendHtmlMail).toHaveBeenCalledWith(
        'alice@example.com',
        expect.stringContaining('John'),
        expect.stringContaining('5 days'),
      );
    });

    it('should log a warning for unknown job names', async () => {
      const job = { name: 'unknown-job', data: {} } as Job;
      await expect(processor.process(job)).resolves.toBeUndefined();
    });
  });

  describe('handleCheckinReminder (via process)', () => {
    it('should send a reminder notification to the user', async () => {
      const job = { name: 'send-checkin-reminder', data: { userId: 'user-42' } } as Job;
      await processor.process(job);

      expect(mockSendNotification).toHaveBeenCalledTimes(1);
      expect(mockSendNotification).toHaveBeenCalledWith({
        user_id: 'user-42',
        title: 'Time to check in!',
        body: "Don't forget to check in today.",
        data: {},
      });
    });
  });

  describe('handleGracePeriodWarning (via process)', () => {
    it('should send a warning notification to the user', async () => {
      mockUserFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Jane' }) });
      mockContactFind.mockResolvedValue([]);

      const job = { name: 'send-warning', data: { userId: 'user-10', days: 7 } } as Job;
      await processor.process(job);

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-10',
          body: expect.stringContaining('7 days'),
        }),
      );
    });

    it('should not send emails when user has no contacts', async () => {
      mockUserFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Jane' }) });
      mockContactFind.mockResolvedValue([]);

      const job = { name: 'send-warning', data: { userId: 'user-10', days: 3 } } as Job;
      await processor.process(job);

      expect(mockSendHtmlMail).not.toHaveBeenCalled();
    });

    it('should skip contacts without email addresses', async () => {
      const contacts = [
        { _id: 'c1', name: 'Bob', email: null, user_id: 'user-5' },
        { _id: 'c2', name: 'Carol', email: 'carol@example.com', user_id: 'user-5' },
      ];
      mockUserFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Alice' }) });
      mockContactFind.mockResolvedValue(contacts);

      const job = { name: 'send-warning', data: { userId: 'user-5', days: 2 } } as Job;
      await processor.process(job);

      expect(mockSendHtmlMail).toHaveBeenCalledTimes(1);
      expect(mockSendHtmlMail).toHaveBeenCalledWith(
        'carol@example.com',
        expect.any(String),
        expect.any(String),
      );
    });

    it('should use singular "day" when days is 1', async () => {
      mockUserFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Mark' }) });
      mockContactFind.mockResolvedValue([
        { name: 'Friend', email: 'friend@example.com', user_id: 'user-6' },
      ]);

      const job = { name: 'send-warning', data: { userId: 'user-6', days: 1 } } as Job;
      await processor.process(job);

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('1 day'),
        }),
      );
      expect(mockSendHtmlMail).toHaveBeenCalledWith(
        'friend@example.com',
        expect.any(String),
        expect.stringContaining('1 day'),
      );
    });

    it('should continue sending emails even if one fails', async () => {
      const contacts = [
        { name: 'Fail', email: 'fail@example.com', user_id: 'user-7' },
        { name: 'Ok', email: 'ok@example.com', user_id: 'user-7' },
      ];
      mockUserFindById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Test' }) });
      mockContactFind.mockResolvedValue(contacts);
      mockSendHtmlMail
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);

      const job = { name: 'send-warning', data: { userId: 'user-7', days: 5 } } as Job;
      await expect(processor.process(job)).resolves.toBeUndefined();
      expect(mockSendHtmlMail).toHaveBeenCalledTimes(2);
    });
  });
});
