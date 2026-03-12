import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SERVICES } from '@app/shared/constants/services';
import { AUTH_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserRtGuards } from '@app/shared/guards/user-rt.guard';
import { GetCurrentUser } from '@app/shared/decorators/get-current-user.decorators';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Post('refresh')
  @UseGuards(UserRtGuards)
  @ApiOperation({ summary: '[Auth] Get new Access Token' })
  async userRefreshAccessToken(
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<any> {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.REFRESH_TOKEN, { refreshToken }),
    );
  }

  @Post('social/zalo')
  @ApiOperation({ summary: '[Auth] Login with Zalo' })
  async logInZalo(@Body() body: { accessToken: string }): Promise<any> {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.LOGIN_ZALO, body),
    );
  }

  @Post('social/line')
  @ApiOperation({ summary: '[Auth] Login with LINE' })
  async logInLINE(@Body() body: { accessToken: string }): Promise<any> {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.LOGIN_LINE, body),
    );
  }

  @Post('social/apple')
  @ApiOperation({ summary: '[Auth] Login with Apple' })
  async logInApple(@Body() body: { identityToken: string }): Promise<any> {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.LOGIN_APPLE, body),
    );
  }

  @Post('social/google')
  @ApiOperation({ summary: '[Auth] Login with Google' })
  async logInGoogle(@Body() body: { idToken: string }): Promise<any> {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.LOGIN_GOOGLE, body),
    );
  }

  @Post('social/facebook')
  @ApiOperation({ summary: '[Auth] Login with Facebook' })
  async loginFacebook(@Body() body: { accessToken: string }): Promise<any> {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.LOGIN_FACEBOOK, body),
    );
  }
}
