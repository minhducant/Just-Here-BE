import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';

import { JustHereService } from './justhere.service';
import { NoteController } from './justhere.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { JUST_HERE_QUEUE } from 'src/shares/queue/justhere.queue';
import { JustHere, JustHereSchema } from './schemas/justhere.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: JUST_HERE_QUEUE,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: JustHere.name, schema: JustHereSchema },
    ]),
  ],
  controllers: [NoteController],
  providers: [JustHereService],
  exports: [JustHereService],
})
export class JustHereModule { }
