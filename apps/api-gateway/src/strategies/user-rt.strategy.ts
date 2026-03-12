import { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JWT_CONSTANTS } from '@app/shared/constants/auth.constants';
import { PayloadAccessTokenDto } from '@app/shared/dtos/payload-access-token.dto';

@Injectable()
export class UserRtStrategy extends PassportStrategy(Strategy, 'user-jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_CONSTANTS.userRefreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: FastifyRequest,
    payload: PayloadAccessTokenDto,
  ): Promise<any> {
    const authHeader = req.headers['authorization'] ?? '';
    const refreshToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';
    if (!refreshToken) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
    return { ...payload, refreshToken };
  }
}
