import { User } from '@sentry/node';
import { AuthService } from 'src/modules/auth/auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { UserRtGuards } from './guards/user-rt.guard';
import { LoginAppleDto } from './dto/login-apple.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { LoginFacebookDto } from './dto/login-facebook.dto';
import { UserAuth } from 'src/shares/decorators/http.decorators';
import { LoginAccessTokenDto } from './dto/login-access-token.dto';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';
import { ResponseLogin } from 'src/modules/auth/dto/response-login.dto';
import { PayloadRefreshTokenDto } from './dto/payload-refresh-token.dto';
import { ResponseRefreshTokenDto } from './dto/response-refresh-token.dto';
import { GetCurrentUser } from 'src/shares/decorators/get-current-user.decorators';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('refresh')
  @ApiOperation({ summary: '[Auth] Get new Access Token' })
  @UseGuards(UserRtGuards)
  async userRefreshAccessToken(
    @GetCurrentUser() user: PayloadRefreshTokenDto,
  ): Promise<ResponseRefreshTokenDto> {
    return this.authService.UserGetAccessToken(user);
  }

  @Post('social/zalo')
  @ApiOperation({ summary: '[Auth] Login with Zalo' })
  async logInZalo(
    @Body() loginDto: LoginAccessTokenDto,
  ): Promise<ResponseLogin> {
    return this.authService.logInZalo(loginDto);
  }

  @Post('social/line')
  @ApiOperation({ summary: '[Auth] Login with LINE' })
  async logInLINE(
    @Body() loginDto: LoginAccessTokenDto,
  ): Promise<ResponseLogin> {
    return this.authService.logInLINE(loginDto);
  }

  @Post('social/apple')
  @ApiOperation({ summary: '[Auth] Login with Apple' })
  async logInApple(
    @Body() loginAppleDto: LoginAppleDto,
  ): Promise<ResponseLogin> {
    return this.authService.logInApple(loginAppleDto);
  }

  @Post('social/google')
  @ApiOperation({ summary: '[Auth] Login with Google' })
  async logInGoogle(@Body() loginDto: LoginGoogleDto): Promise<ResponseLogin> {
    return this.authService.logInGoogle(loginDto);
  }

  @Post('social/facebook')
  @ApiOperation({ summary: '[Auth] Login with Facebook' })
  async loginFacebook(
    @Body() loginDto: LoginFacebookDto,
  ): Promise<ResponseLogin> {
    return this.authService.loginFacebook(loginDto);
  }
}
