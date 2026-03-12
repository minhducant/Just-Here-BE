import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { createRedisStore } from 'src/configs/redis.config';
import { UserModule } from 'src/modules/user/user.module';
import { UserAtStrategy } from './strategies/user-at.strategy';
import { UserRtStrategy } from './strategies/user-rt.strategy';

@Module({
  imports: [
    UserModule,
    JwtModule.register({}),
    CacheModule.register({
      store: createRedisStore(),
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, UserAtStrategy, UserRtStrategy],
})
export class AuthModule {}
