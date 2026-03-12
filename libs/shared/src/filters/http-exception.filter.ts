import {
  Catch,
  HttpStatus,
  HttpException,
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const code = exceptionResponse?.code || 'SOME_THING_WENT_WRONG';
    const message = exceptionResponse?.message || 'Unknown errors';
    const rest =
      exceptionResponse && typeof exceptionResponse === 'object'
        ? exceptionResponse
        : {};

    response.status(status).send({
      code,
      statusCode: status || HttpStatus.INTERNAL_SERVER_ERROR,
      info: {
        message,
        ...rest,
      },
      path: request.url,
    });
  }
}
