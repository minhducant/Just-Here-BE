import {
  Inject,
  Injectable,
  HttpStatus,
  HttpException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as config from 'config';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import {
  JWT_CONSTANTS,
  USER_AUTH_CACHE_PREFIX,
} from 'src/modules/auth/auth.constants';
import { httpErrors } from 'src/shares/exceptions';
import { UserService } from '../user/user.service';
import { User } from '../user/schemas/user.schema';
import { LoginAppleDto } from './dto/login-apple.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { LoginFacebookDto } from './dto/login-facebook.dto';
import { UserGoogleInfoDto } from './dto/user-google-info.dto';
import { LoginAccessTokenDto } from './dto/login-access-token.dto';
import { UserFacebookInfoDto } from './dto/user-facebook-info.dto';
import { ResponseLogin } from 'src/modules/auth/dto/response-login.dto';
import { PayloadRefreshTokenDto } from './dto/payload-refresh-token.dto';
import { ResponseRefreshTokenDto } from './dto/response-refresh-token.dto';
import { PayloadAccessTokenDto } from 'src/shares/dtos/payload-access-token.dto';

const appleJwksUrl = config.get<string>('apple.jwks');
const appleIssuer = config.get<string>('apple.issuer');
const baseZaloUrl = config.get<string>('zalo.base_api');
const baseGoogleUrl = config.get<string>('google.base_api');
const baseFacebookUrl = config.get<string>('facebook.graph_api');

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
    private httpService: HttpService,
    private userService: UserService,
  ) {}

  async UserGetAccessToken(
    refreshToken: string,
  ): Promise<ResponseRefreshTokenDto> {
    let payload: PayloadRefreshTokenDto;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: JWT_CONSTANTS.userRefreshTokenSecret,
      });
    } catch {
      throw new HttpException(
        httpErrors.REFRESH_TOKEN_EXPIRED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { userId } = payload;
    const [user, oldRefreshToken] = await Promise.all([
      this.userService.findById(userId.toString()),
      this.cacheManager.get<string>(`${USER_AUTH_CACHE_PREFIX}${userId}`),
    ]);
    if (!user) throw new ForbiddenException();
    if (!oldRefreshToken)
      throw new HttpException(
        httpErrors.REFRESH_TOKEN_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    if (refreshToken === oldRefreshToken) {
      const [newAccessToken, newRefreshToken] = await Promise.all([
        this.generateUserAccessToken(user['_id']),
        this.generateUserRefreshToken(user['_id']),
      ]);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        iat: Date.now(),
        exp: Date.now() + JWT_CONSTANTS.userAccessTokenExpiry,
      };
    } else
      throw new HttpException(
        httpErrors.REFRESH_TOKEN_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
  }

  async generateUserAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: user,
        date: Date.now(),
      },
      {
        secret: JWT_CONSTANTS.userAccessTokenSecret,
        expiresIn: JWT_CONSTANTS.userAccessTokenExpiry,
      },
    );
  }

  async generateUserRefreshToken(user: User): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      {
        userId: user,
        date: Date.now(),
      },
      {
        secret: JWT_CONSTANTS.userRefreshTokenSecret,
        expiresIn: JWT_CONSTANTS.userRefreshTokenExpiry,
      },
    );
    await this.cacheManager.set(
      `${USER_AUTH_CACHE_PREFIX}${user['_id']}`,
      refreshToken,
      JWT_CONSTANTS.userRefreshTokenExpiry * 1000,
    );
    return refreshToken;
  }

  async decodeAccessToken(
    accessToken: string,
  ): Promise<PayloadAccessTokenDto | any> {
    return this.jwtService.decode(accessToken);
  }

  async loginFacebook(
    loginFacebookDto: LoginFacebookDto,
  ): Promise<ResponseLogin> {
    const { accessToken } = loginFacebookDto;
    const url = `${baseFacebookUrl}me?fields=id,first_name,last_name,picture&access_token=${accessToken}`;
    const userData: UserFacebookInfoDto = await lastValueFrom(
      this.httpService
        .get(url)
        .pipe(
          map((response) => {
            return response.data || null;
          }),
        )
        .pipe(
          catchError((error) => {
            throw new BadRequestException(error.message);
          }),
        ),
    );
    if (!userData) {
      throw new BadRequestException(
        httpErrors.FACEBOOK_TOKEN_INVALID_OR_EXPIRES,
      );
    }
    const user = await this.userService.findOrCreateFacebookUser(userData);
    const [accessToken_, refreshToken] = await Promise.all([
      this.generateUserAccessToken(user['_id']),
      this.generateUserRefreshToken(user['_id']),
    ]);
    return {
      accessToken: accessToken_,
      refreshToken,
      iat: Date.now(),
      exp: Date.now() + JWT_CONSTANTS.userAccessTokenExpiry,
    };
  }

  async logInGoogle(loginGoogleDto: LoginGoogleDto): Promise<any> {
    const { idToken } = loginGoogleDto;
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const userData: UserGoogleInfoDto = await lastValueFrom(
      this.httpService
        .get(url)
        .pipe(map((response) => response.data || null))
        .pipe(
          catchError((error) => {
            throw new BadRequestException(error.message);
          }),
        ),
    );
    if (!userData) {
      throw new BadRequestException(httpErrors.GOOGLE_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.userService.findOrCreateGoogleUser(userData);
    const [accessToken_, refreshToken] = await Promise.all([
      this.generateUserAccessToken(user['_id']),
      this.generateUserRefreshToken(user['_id']),
    ]);
    return {
      accessToken: accessToken_,
      refreshToken,
      iat: Date.now(),
      exp: Date.now() + JWT_CONSTANTS.userAccessTokenExpiry,
    };
  }

  async logInZalo(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
    const url = `${baseZaloUrl}me?fields=id,name,picture`;
    const userData = await lastValueFrom(
      this.httpService
        .get(url, {
          headers: {
            access_token: accessToken,
          },
        })
        .pipe(
          map((response) => {
            return response.data || null;
          }),
        )
        .pipe(
          catchError((error) => {
            throw new BadRequestException(error.message);
          }),
        ),
    );
    if (userData.error === 452) {
      throw new BadRequestException(httpErrors.ZALO_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.userService.findOrCreateZaloUser(userData);
    const [accessToken_, refreshToken] = await Promise.all([
      this.generateUserAccessToken(user['_id']),
      this.generateUserRefreshToken(user['_id']),
    ]);
    return {
      accessToken: accessToken_,
      refreshToken,
      iat: Date.now(),
      exp: Date.now() + JWT_CONSTANTS.userAccessTokenExpiry,
    };
  }

  async logInApple(loginDto: LoginAppleDto): Promise<any> {
    const { identityToken } = loginDto;
    try {
      const jwks = createRemoteJWKSet(
        new URL('https://appleid.apple.com/auth/keys'),
      );
      const { payload } = await jwtVerify(identityToken, jwks, {
        issuer: appleIssuer,
        audience: [config.get<string>('apple.audience')],
      });
      const appleProfile = {
        sub: payload.sub,
        email: payload.email ?? null,
        email_verified: payload.email_verified === 'true',
        is_private_email: payload.is_private_email === 'true',
      };
      if (!appleProfile.sub) {
        throw new ForbiddenException('Invalid Apple token payload');
      }
      const user = await this.userService.findOrCreateAppleUser(appleProfile);
      const [accessToken_, refreshToken] = await Promise.all([
        this.generateUserAccessToken(user['_id']),
        this.generateUserRefreshToken(user['_id']),
      ]);
      return {
        accessToken: accessToken_,
        refreshToken,
        iat: Date.now(),
        exp: Date.now() + JWT_CONSTANTS.userAccessTokenExpiry,
      };
    } catch (error) {
      throw new BadRequestException('Apple token invalid or expired');
    }
  }

  async logInLINE(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
    const url = 'https://api.line.me/v2/profile';
    const userData = await lastValueFrom(
      this.httpService
        .get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          map((response) => {
            return response.data || null;
          }),
        )
        .pipe(
          catchError((error) => {
            throw new BadRequestException(error.message);
          }),
        ),
    );
    if (!userData) {
      throw new BadRequestException(httpErrors.ZALO_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.userService.findOrCreateLINEUser(userData);
    const [accessToken_, refreshToken] = await Promise.all([
      this.generateUserAccessToken(user['_id']),
      this.generateUserRefreshToken(user['_id']),
    ]);
    return {
      accessToken: accessToken_,
      refreshToken,
      iat: Date.now(),
      exp: Date.now() + JWT_CONSTANTS.userAccessTokenExpiry,
    };
  }

  async logInX(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
    const url = 'https://api.twitter.com/2/me';
  }

  async logInKakaoTalk(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
    const url = `https://kapi.kakao.com/v1/api/talk/profile`;
  }

  async logInWhatsApp(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
  }

  async logInWeChat(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
  }

  async logInSnapchat(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
  }

  async logInTwitter(loginDto: LoginAccessTokenDto): Promise<any> {
    const { accessToken } = loginDto;
  }
}
