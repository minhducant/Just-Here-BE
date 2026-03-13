import * as firebase from 'firebase-admin';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../user/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { NotificationService } from './notification.service';
import { Notification } from './schemas/notification.schema';
import { NotificationToken } from './schemas/notification_token.schema';

jest.mock('firebase-admin', () => ({
  messaging: jest.fn(),
}));

describe('NotificationService', () => {
  let service: NotificationService;

  const mockUserExec = jest.fn();
  const mockUserLean = jest.fn(() => ({ exec: mockUserExec }));
  const mockUserSelect = jest.fn(() => ({ lean: mockUserLean }));
  const mockUserFindById = jest.fn(() => ({ select: mockUserSelect }));
  const mockUserModel = {
    findById: mockUserFindById,
  };

  const mockNotificationCreate = jest.fn();
  const mockNotificationModel = {
    create: mockNotificationCreate,
  };

  const mockNotificationTokenExec = jest.fn();
  const mockNotificationTokenAggregate = jest.fn(() => ({
    exec: mockNotificationTokenExec,
  }));
  const mockNotificationTokenModel = {
    aggregate: mockNotificationTokenAggregate,
  };

  const mockSendEachForMulticast = jest.fn();
  const mockMailService = {
    sendHtmlMail: jest.fn(),
  };

  beforeEach(async () => {
    (firebase.messaging as jest.Mock).mockReturnValue({
      sendEachForMulticast: mockSendEachForMulticast,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(NotificationToken.name),
          useValue: mockNotificationTokenModel,
        },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should skip creating and sending notification when notifications are disabled', async () => {
    mockUserExec.mockResolvedValue({ notifications_enabled: false });

    await service.sendNotification({
      user_id: '65e1711ef5f60e3a0f3ce603',
      title: 'Hello',
      body: 'World',
      data: { source: 'test' },
    });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
    expect(mockNotificationTokenAggregate).not.toHaveBeenCalled();
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it('should create and send notification when notifications are enabled', async () => {
    mockUserExec.mockResolvedValue({ notifications_enabled: true });
    mockNotificationCreate.mockResolvedValue(undefined);
    mockNotificationTokenExec.mockResolvedValue([
      { notification_token: 'token-1' },
    ]);
    mockSendEachForMulticast.mockResolvedValue(undefined);

    await service.sendNotification({
      user_id: '65e1711ef5f60e3a0f3ce603',
      title: 'Hello',
      body: 'World',
      data: { source: 'test' },
    });

    expect(mockNotificationCreate).toHaveBeenCalledWith({
      user_id: '65e1711ef5f60e3a0f3ce603',
      title: 'Hello',
      body: 'World',
      data: { source: 'test' },
      is_read: false,
    });
    expect(mockNotificationTokenAggregate).toHaveBeenCalled();
    expect(mockSendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['token-1'],
      notification: {
        title: 'Hello',
        body: 'World',
      },
      data: { source: 'test' },
    });
  });
});
