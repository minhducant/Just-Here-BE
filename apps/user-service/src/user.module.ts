import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { mongodb } from '@app/shared/configs/database.config';
import { createRedisStore } from '@app/shared/configs/redis.config';
import { User, UserSchema } from '@app/shared/schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(mongodb.uri, mongodb.options),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CacheModule.register({
      store: createRedisStore(),
      isGlobal: true,
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
