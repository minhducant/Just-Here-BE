import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

describe('MailController', () => {
  let controller: MailController;
  let mailService: MailService;

  const mockMailService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [{ provide: MailService, useValue: mockMailService }],
    }).compile();

    controller = module.get<MailController>(MailController);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMail', () => {
    it('should call mailService.sendMail with the provided dto', async () => {
      const dto: SendMailDto = {
        to: 'user@example.com',
        subject: 'Hello',
        text: 'Plain text content',
      };
      mockMailService.sendMail.mockResolvedValue(undefined);

      await controller.sendMail(dto);

      expect(mailService.sendMail).toHaveBeenCalledWith(dto);
    });

    it('should call mailService.sendMail with html content', async () => {
      const dto: SendMailDto = {
        to: 'user@example.com',
        subject: 'Hello HTML',
        html: '<h1>Hello!</h1>',
      };
      mockMailService.sendMail.mockResolvedValue(undefined);

      await controller.sendMail(dto);

      expect(mailService.sendMail).toHaveBeenCalledWith(dto);
    });

    it('should propagate errors from mailService.sendMail', async () => {
      const dto: SendMailDto = {
        to: 'user@example.com',
        subject: 'Error Test',
        text: 'body',
      };
      mockMailService.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(controller.sendMail(dto)).rejects.toThrow('SMTP error');
    });
  });
});
