import { Module } from '@nestjs/common';

import { CheckinModule } from 'src/modules/check-in/check-in.module';
import { MailModule } from 'src/modules/mail/mail.module';

import { CheckinToolsController } from './check-in-tools.controller';

@Module({
  imports: [CheckinModule, MailModule],
  controllers: [CheckinToolsController],
})
export class CheckinToolsModule {}