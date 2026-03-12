import {
  HttpStatus,
  HttpException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';

import { httpErrors } from '../exceptions';

export const UserID = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const userId = request?.user?._id?.toString();
      if (userId) {
        return userId;
      }
      throw new HttpException(httpErrors.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    } catch (e) {
      throw new HttpException(httpErrors.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
  },
);

