import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SERVICES } from '@app/shared/constants/services';
import { MAIL_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserAuth } from '@app/shared/decorators/http.decorators';

@ApiTags('Mail')
@Controller('mail')
@UserAuth()
export class MailController {
  constructor(
    @Inject(SERVICES.MAIL_SERVICE) private readonly mailClient: ClientProxy,
  ) {}

  @Post('send')
  @ApiOperation({ summary: '[Mail] Send mail' })
  async sendMail(@Body() body: Record<string, any>): Promise<any> {
    return firstValueFrom(
      this.mailClient.send(MAIL_PATTERNS.SEND, body),
    );
  }
}
