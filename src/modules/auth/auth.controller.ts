import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UserService } from '../user/user.service';
import { LoginAppleDto } from './dto/login-apple.dto';
import { UserRtGuards } from './guards/user-rt.guard';
import { LoginGoogleDto } from './dto/login-google.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginFacebookDto } from './dto/login-facebook.dto';
import { AuthService } from 'src/modules/auth/auth.service';
import { LoginAccessTokenDto } from './dto/login-access-token.dto';
import { ResponseLogin } from 'src/modules/auth/dto/response-login.dto';
import { ResponseRefreshTokenDto } from './dto/response-refresh-token.dto';
import { GetCurrentUser } from 'src/shares/decorators/get-current-user.decorators';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('logout')
  @UseGuards(UserRtGuards)
  @ApiBearerAuth()
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiOperation({ summary: '[Auth] Logout user' })
  async logout(
    @GetCurrentUser('userId') userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<{ success: boolean }> {
    return this.authService.logout(userId, refreshToken);
  }

  @Post('refresh')
  @UseGuards(UserRtGuards)
  @ApiBearerAuth()
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiOperation({ summary: '[Auth] Get new Access Token' })
  async userRefreshAccessToken(
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<ResponseRefreshTokenDto> {
    return this.authService.UserGetAccessToken(refreshToken);
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
