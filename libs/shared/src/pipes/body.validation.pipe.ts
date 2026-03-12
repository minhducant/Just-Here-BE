import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class BodyValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      skipMissingProperties: false,
      exceptionFactory: (errs: ValidationError[]) => {
        return new HttpException(
          {
            message: `Validation errors on these fields: ${getMessageFromErrs(errs)}`,
            code: 'USER_00400',
            statusCode: 400,
            messageDetail: getPropertyAndConstraints(errs),
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    });
  }
}

function getMessageFromErrs(errs: ValidationError[], parent: string = null): string {
  return errs
    .map((e) => {
      const current = parent ? `${parent}.${e.property}` : `${e.property}`;
      if (e.children?.length > 0) return `${getMessageFromErrs(e.children, current)}`;
      else return current;
    })
    .join(', ');
}

function getPropertyAndConstraints(errs: ValidationError[]): unknown[] {
  const details = [];
  errs.forEach((e) => {
    if (e.children?.length > 0) {
      getPropertyAndConstraints(e.children).forEach((item) => details.push(item));
    } else {
      details.push({
        property: e.property,
        constraints: Object.values(e.constraints ?? {}),
      });
    }
  });
  return details;
}
