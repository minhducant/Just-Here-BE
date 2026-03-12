import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { JWT_CONSTANTS } from '@app/shared/constants/auth.constants';
import { PayloadAccessTokenDto } from '@app/shared/dtos/payload-access-token.dto';

@Injectable()
export class UserAtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_CONSTANTS.userAccessTokenSecret,
    });
  }

  async validate(payload: PayloadAccessTokenDto): Promise<PayloadAccessTokenDto> {
    return payload;
  }
}
