import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';

import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Mail] Send mail' })
  async sendMail(@Body() body: SendMailDto): Promise<void> {
    await this.mailService.sendMail(body);
  }
}
