import {
  HttpStatus,
  HttpException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { httpErrors } from '@app/shared/exceptions';

export const UserID = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      // In the API Gateway, request.user is the JWT payload with userId property
      const userId =
        request?.user?.userId?.toString() || request?.user?._id?.toString();
      if (userId) {
        return userId;
      }
      throw new HttpException(httpErrors.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    } catch (e) {
      throw new HttpException(httpErrors.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
  },
);
