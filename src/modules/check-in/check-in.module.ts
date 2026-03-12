import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';

import { CheckinService } from './check-in.service';
import { CheckinController } from './check-in.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { Checkin, CheckinSchema } from './schemas/check-in.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: JUST_HERE_QUEUE,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Checkin.name, schema: CheckinSchema },
    ]),
  ],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
