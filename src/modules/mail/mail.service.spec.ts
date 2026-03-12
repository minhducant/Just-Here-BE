import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

const mockSendMailFn = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: (...args: any[]) => mockSendMailFn(...args),
  }),
}));

const mockMailConfig = {
  host: 'smtp.test.com',
  port: 587,
  auth: { user: 'user@test.com', pass: 'password' },
  from: 'noreply@test.com',
  service: '',
  enable: true,
};

jest.mock('src/configs/mail.config', () => ({
  get mailConfig() {
    return mockMailConfig;
  },
}));

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should skip sending when mail is disabled', async () => {
      mockMailConfig.enable = false;

      const dto: SendMailDto = {
        to: 'test@example.com',
        subject: 'Test',
        text: 'Hello',
      };

      await service.sendMail(dto);
      expect(mockSendMailFn).not.toHaveBeenCalled();
    });

    it('should send plain text email when mail is enabled', async () => {
      mockMailConfig.enable = true;

      const dto: SendMailDto = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Plain text body',
      };

      await service.sendMail(dto);
      expect(mockSendMailFn).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          text: 'Plain text body',
        }),
      );
    });

    it('should send HTML email when mail is enabled', async () => {
      mockMailConfig.enable = true;

      const dto: SendMailDto = {
        to: 'test@example.com',
        subject: 'HTML Email',
        html: '<h1>Hello</h1>',
      };

      await service.sendMail(dto);
      expect(mockSendMailFn).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'HTML Email',
          html: '<h1>Hello</h1>',
        }),
      );
    });

    it('should send email with cc and bcc when provided', async () => {
      mockMailConfig.enable = true;

      const dto: SendMailDto = {
        to: 'to@example.com',
        subject: 'With CC/BCC',
        text: 'Body',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
      };

      await service.sendMail(dto);
      expect(mockSendMailFn).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
        }),
      );
    });

    it('should throw error when sending fails', async () => {
      mockMailConfig.enable = true;
      mockSendMailFn.mockRejectedValueOnce(new Error('SMTP connection refused'));

      const dto: SendMailDto = {
        to: 'test@example.com',
        subject: 'Fail',
        text: 'Body',
      };

      await expect(service.sendMail(dto)).rejects.toThrow('SMTP connection refused');
    });
  });

  describe('sendTextMail', () => {
    it('should call sendMail with text content', async () => {
      const spy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);
      await service.sendTextMail('to@example.com', 'Subject', 'Text body');
      expect(spy).toHaveBeenCalledWith({
        to: 'to@example.com',
        subject: 'Subject',
        text: 'Text body',
      });
    });
  });

  describe('sendHtmlMail', () => {
    it('should call sendMail with html content', async () => {
      const spy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);
      await service.sendHtmlMail('to@example.com', 'Subject', '<b>Hello</b>');
      expect(spy).toHaveBeenCalledWith({
        to: 'to@example.com',
        subject: 'Subject',
        html: '<b>Hello</b>',
      });
    });
  });
});
