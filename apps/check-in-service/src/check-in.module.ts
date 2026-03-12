import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { mongodb } from '@app/shared/configs/database.config';
import { redisConfig } from '@app/shared/configs/redis.config';
import { User, UserSchema } from '@app/shared/schemas/user.schema';
import { Checkin, CheckinSchema } from '@app/shared/schemas/check-in.schema';
import { Contact, ContactSchema } from '@app/shared/schemas/contact.schema';
import { JUST_HERE_QUEUE } from '@app/shared/queue/justhere.queue';
import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';
import { CheckInProcessor } from './check-in.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(mongodb.uri, mongodb.options),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
    BullModule.forRoot({
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
      },
    }),
    BullModule.registerQueue({ name: JUST_HERE_QUEUE }),
  ],
  controllers: [CheckInController],
  providers: [CheckInService, CheckInProcessor],
})
export class CheckInModule {}
