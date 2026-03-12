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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { v4 as uuidv4 } from 'uuid';

import { JWT_CONSTANTS, USER_AUTH_CACHE_PREFIX } from '@app/shared/constants/auth.constants';
import { httpErrors } from '@app/shared/exceptions';
import { User, UserDocument } from '@app/shared/schemas/user.schema';
import { UserRole, UserStatus } from '@app/shared/enums/user.enum';

const appleJwksUrl = config.get<string>('apple.jwks');
const appleIssuer = config.get<string>('apple.issuer');
const baseZaloUrl = config.get<string>('zalo.base_api');
const baseFacebookUrl = config.get<string>('facebook.graph_api');

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
    private httpService: HttpService,
  ) {}

  generateUserId(): string {
    return uuidv4().slice(0, 8).toUpperCase();
  }

  async UserGetAccessToken(refreshToken: string): Promise<any> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: JWT_CONSTANTS.userRefreshTokenSecret,
      });
    } catch {
      throw new HttpException(httpErrors.REFRESH_TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
    }

    const { userId } = payload;
    const [user, oldRefreshToken] = await Promise.all([
      this.userModel.findById(userId.toString()),
      this.cacheManager.get<string>(`${USER_AUTH_CACHE_PREFIX}${userId}`),
    ]);

    if (!user) throw new ForbiddenException();
    if (!oldRefreshToken) {
      throw new HttpException(httpErrors.REFRESH_TOKEN_EXPIRED, HttpStatus.BAD_REQUEST);
    }

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
    }
    throw new HttpException(httpErrors.REFRESH_TOKEN_EXPIRED, HttpStatus.BAD_REQUEST);
  }

  async generateUserAccessToken(user: any): Promise<string> {
    return this.jwtService.signAsync(
      { userId: user, date: Date.now() },
      {
        secret: JWT_CONSTANTS.userAccessTokenSecret,
        expiresIn: JWT_CONSTANTS.userAccessTokenExpiry,
      },
    );
  }

  async generateUserRefreshToken(user: any): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      { userId: user, date: Date.now() },
      {
        secret: JWT_CONSTANTS.userRefreshTokenSecret,
        expiresIn: JWT_CONSTANTS.userRefreshTokenExpiry,
      },
    );
    await this.cacheManager.set(
      `${USER_AUTH_CACHE_PREFIX}${user['_id'] ?? user}`,
      refreshToken,
      JWT_CONSTANTS.userRefreshTokenExpiry * 1000,
    );
    return refreshToken;
  }

  async loginFacebook(loginFacebookDto: { accessToken: string }): Promise<any> {
    const { accessToken } = loginFacebookDto;
    const url = `${baseFacebookUrl}/me?fields=id,first_name,last_name,picture&access_token=${accessToken}`;
    const userData = await lastValueFrom(
      this.httpService
        .get(url)
        .pipe(map((response) => response.data || null))
        .pipe(catchError((error) => { throw new BadRequestException(error.message); })),
    );
    if (!userData) {
      throw new BadRequestException(httpErrors.FACEBOOK_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.findOrCreateFacebookUser(userData);
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

  async logInGoogle(loginGoogleDto: { idToken: string }): Promise<any> {
    const { idToken } = loginGoogleDto;
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const userData = await lastValueFrom(
      this.httpService
        .get(url)
        .pipe(map((response) => response.data || null))
        .pipe(catchError((error) => { throw new BadRequestException(error.message); })),
    );
    if (!userData) {
      throw new BadRequestException(httpErrors.GOOGLE_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.findOrCreateGoogleUser(userData);
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

  async logInZalo(loginDto: { accessToken: string }): Promise<any> {
    const { accessToken } = loginDto;
    const url = `${baseZaloUrl}/me?fields=id,name,picture`;
    const userData = await lastValueFrom(
      this.httpService
        .get(url, { headers: { access_token: accessToken } })
        .pipe(map((response) => response.data || null))
        .pipe(catchError((error) => { throw new BadRequestException(error.message); })),
    );
    if (userData.error === 452) {
      throw new BadRequestException(httpErrors.ZALO_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.findOrCreateZaloUser(userData);
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

  async logInApple(loginDto: { identityToken: string }): Promise<any> {
    const { identityToken } = loginDto;
    try {
      const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
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
      const user = await this.findOrCreateAppleUser(appleProfile);
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

  async logInLINE(loginDto: { accessToken: string }): Promise<any> {
    const { accessToken } = loginDto;
    const url = 'https://api.line.me/v2/profile';
    const userData = await lastValueFrom(
      this.httpService
        .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
        .pipe(map((response) => response.data || null))
        .pipe(catchError((error) => { throw new BadRequestException(error.message); })),
    );
    if (!userData) {
      throw new BadRequestException(httpErrors.LINE_TOKEN_INVALID_OR_EXPIRES);
    }
    const user = await this.findOrCreateLINEUser(userData);
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

  // User find/create helpers (auth-service accesses DB directly for auth flows)
  async findOrCreateFacebookUser(profile: any): Promise<User> {
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ facebook_id: profile.id });
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        { last_login_at: new Date() },
        { new: true },
      );
    }
    return this.userModel.create({
      facebook_id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      user_id,
      image_url: profile.picture?.data?.url,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    const { sub, picture, given_name, family_name, email } = profile;
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ google_id: sub });
    if (user) {
      return this.userModel.findByIdAndUpdate(
        user._id,
        { last_login_at: new Date(), email },
        { new: true },
      );
    }
    return this.userModel.create({
      google_id: sub,
      name: `${given_name} ${family_name}`,
      user_id,
      image_url: picture,
      role: UserRole.user,
      last_login_at: new Date(),
      email,
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateZaloUser(profile: any): Promise<User> {
    const { name, id, picture } = profile;
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ zalo_id: id });
    if (user) {
      return this.userModel.findByIdAndUpdate(user._id, { last_login_at: new Date() }, { new: true });
    }
    return this.userModel.create({
      zalo_id: id,
      name,
      user_id,
      image_url: picture?.data?.url,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateAppleUser(profile: any): Promise<User> {
    const { sub, email } = profile;
    const user_id = this.generateUserId();
    const existingUser = await this.userModel.findOne({ apple_id: sub });
    if (existingUser) {
      return this.userModel.findByIdAndUpdate(
        existingUser._id,
        { last_login_at: new Date(), ...(email && { email }) },
        { new: true },
      );
    }
    return this.userModel.create({
      apple_id: sub,
      user_id,
      name: email ? email.split('@')[0] : `AppleUser_${user_id}`,
      email: email ?? null,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }

  async findOrCreateLINEUser(profile: any): Promise<User> {
    const { displayName, userId, pictureUrl } = profile;
    const user_id = this.generateUserId();
    const user = await this.userModel.findOne({ line_id: userId });
    if (user) {
      return this.userModel.findByIdAndUpdate(user._id, { last_login_at: new Date() }, { new: true });
    }
    return this.userModel.create({
      line_id: userId,
      name: displayName,
      user_id,
      image_url: pictureUrl,
      role: UserRole.user,
      last_login_at: new Date(),
      status: UserStatus.ACTIVE,
      is_verify: true,
    });
  }
}
