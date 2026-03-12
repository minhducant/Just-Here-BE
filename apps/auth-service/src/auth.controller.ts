import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AUTH_PATTERNS } from '@app/shared/constants/message-patterns';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.REFRESH_TOKEN)
  async refreshToken(@Payload() data: { refreshToken: string }): Promise<any> {
    return this.authService.UserGetAccessToken(data.refreshToken);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN_GOOGLE)
  async loginGoogle(@Payload() data: { idToken: string }): Promise<any> {
    return this.authService.logInGoogle(data);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN_FACEBOOK)
  async loginFacebook(@Payload() data: { accessToken: string }): Promise<any> {
    return this.authService.loginFacebook(data);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN_APPLE)
  async loginApple(@Payload() data: { identityToken: string }): Promise<any> {
    return this.authService.logInApple(data);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN_ZALO)
  async loginZalo(@Payload() data: { accessToken: string }): Promise<any> {
    return this.authService.logInZalo(data);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN_LINE)
  async loginLine(@Payload() data: { accessToken: string }): Promise<any> {
    return this.authService.logInLINE(data);
  }
}
