import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';

import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';
import { UserAuth } from 'src/shares/decorators/http.decorators';

@ApiTags('Mail')
@Controller('mail')
@UserAuth()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiOperation({ summary: '[Mail] Send mail' })
  async sendMail(@Body() body: SendMailDto): Promise<void> {
    await this.mailService.sendMail(body);
  }
}
