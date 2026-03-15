import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { mongodb } from 'src/configs/database.config';
import { redisConfig, createRedisStore } from 'src/configs/redis.config';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
//Customer Module
import { UserModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { MailModule } from 'src/modules/mail/mail.module';
import { SystemModule } from 'src/modules/system/system.module';
import { ContactModule } from 'src/modules/contact/contact.module';
import { CheckinModule } from 'src/modules/check-in/check-in.module';
import { NotificationModule } from 'src/modules/notification/notification.module';

const Modules: any = [
  ConsoleModule,
  ScheduleModule.forRoot(),
  ConfigModule.forRoot({ isGlobal: true }),
  MongooseModule.forRoot(mongodb.uri, mongodb.options),
  BullModule.forRoot({
    connection: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
    },
  }),
  BullModule.registerQueue({
    name: JUST_HERE_QUEUE,
  }),
  CacheModule.register({
    store: createRedisStore(),
    isGlobal: true,
    ttl: 60000,
  }),
  EventEmitterModule.forRoot({
    global: true,
  }),
  //Customer Module
  AuthModule,
  UserModule,
  CheckinModule,
  ContactModule,
  NotificationModule,
  MailModule,
  SystemModule,
];
export default Modules;
