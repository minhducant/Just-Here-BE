import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { Contact, ContactSchema } from './schemas/contact.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: JUST_HERE_QUEUE,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
