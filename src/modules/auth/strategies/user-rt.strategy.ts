import { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JWT_CONSTANTS } from '../auth.constants';
import { PayloadRefreshTokenDto } from '../dto/payload-refresh-token.dto';

@Injectable()
export class UserRtStrategy extends PassportStrategy(Strategy, 'user-jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: FastifyRequest) => {
          const body = req.body as { refreshToken?: string } | undefined;
          if (body?.refreshToken?.trim()) {
            return body.refreshToken.trim();
          }
          const authHeader = req.headers['authorization'] ?? '';
          if (authHeader.startsWith('Bearer ')) {
            return authHeader.slice('Bearer '.length).trim();
          }
          return null;
        },
      ]),
      secretOrKey: JWT_CONSTANTS.userRefreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: FastifyRequest, payload: PayloadRefreshTokenDto): Promise<any> {
    const bodyRefreshToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken?.trim();
    const authHeader = req.headers['authorization'] ?? '';
    const refreshToken = bodyRefreshToken
      || (authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : '');
    if (!refreshToken) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
    return {
      ...payload,
      refreshToken,
    };
  }
}
