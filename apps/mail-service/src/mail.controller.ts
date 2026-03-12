import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MAIL_PATTERNS } from '@app/shared/constants/message-patterns';
import { MailService } from './mail.service';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @MessagePattern(MAIL_PATTERNS.SEND)
  async sendMail(@Payload() data: any): Promise<void> {
    return this.mailService.sendMail(data);
  }
}
