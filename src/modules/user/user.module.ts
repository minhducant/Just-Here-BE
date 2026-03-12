import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { createRedisStore } from 'src/configs/redis.config';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CacheModule.register({
      store: createRedisStore(),
      isGlobal: true,
    }),
  ],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
