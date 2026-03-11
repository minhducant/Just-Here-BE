import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { mongodb } from 'src/configs/database.config';
import { redisConfig } from 'src/configs/redis.config';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
//Customer Module
import { NoteModule } from 'src/modules/note/note.module';
import { UserModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { DebtModule } from 'src/modules/debt/debt.module';
import { ToolModule } from 'src/modules/tool/tool.module';
import { InviteModule } from 'src/modules/invite/invite.module';
import { FriendModule } from 'src/modules/friend/friend.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { MessagesModule } from 'src/modules/messages/messages.module';
import { JustHereModule } from 'src/modules/justhere/justhere.module';
import { NotificationModule } from 'src/modules/notification/notification.module';

const Modules: any = [
  ConsoleModule,
  ScheduleModule.forRoot(),
  ConfigModule.forRoot({ isGlobal: true }),
  MongooseModule.forRoot(mongodb.uri, mongodb.options),
  BullModule.registerQueue({
    name: JUST_HERE_QUEUE,
  }),
  CacheModule.register({
    store: redisStore,
    ...redisConfig,
    isGlobal: true,
    ttl: 60,
  }),
  EventEmitterModule.forRoot({
    global: true,
  }),
  //Customer Module
  AuthModule,
  UserModule,
  FriendModule,
  InviteModule,
  NoteModule,
  MessagesModule,
  DebtModule,
  PaymentModule,
  NotificationModule,
  JustHereModule,
  ToolModule,
];
export default Modules;
