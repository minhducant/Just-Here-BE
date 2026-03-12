import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';

import { CheckinService } from './check-in.service';
import { CheckinProcessor } from './check-in.processor';
import { MailModule } from 'src/modules/mail/mail.module';
import { CheckinController } from './check-in.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { Checkin, CheckinSchema } from './schemas/check-in.schema';
import { NotificationModule } from '../notification/notification.module';
import { Contact, ContactSchema } from '../contact/schemas/contact.schema';

@Module({
  imports: [
    MailModule,
    NotificationModule,
    BullModule.registerQueue({
      name: JUST_HERE_QUEUE,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [CheckinController],
  providers: [CheckinService, CheckinProcessor],
  exports: [CheckinService],
})
export class CheckinModule {}
