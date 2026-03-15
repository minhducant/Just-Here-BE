import { ConsoleLogger } from '@nestjs/common';

import {
  appendSystemLog,
  SystemLogLevel,
} from 'src/modules/system/system-log.store';

export class SystemBufferedLogger extends ConsoleLogger {
  private capture(level: SystemLogLevel, message: unknown, optionalParams: unknown[]): void {
    const { context, payload } = this.splitContext(optionalParams);
    const messageParts = [message, ...payload];
    const normalizedMessage = messageParts
      .map((part) => this.normalize(part))
      .filter(Boolean)
      .join(' ')
      .trim();

    appendSystemLog({
      level,
      context,
      message: normalizedMessage || '[empty message]',
    });
  }

  private normalize(value: unknown): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Error) {
      return value.stack || value.message;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private splitContext(optionalParams: unknown[]): {
    context: string;
    payload: unknown[];
  } {
    const lastParam = optionalParams[optionalParams.length - 1];
    if (typeof lastParam === 'string') {
      return {
        context: lastParam,
        payload: optionalParams.slice(0, -1),
      };
    }

    return {
      context: 'System',
      payload: optionalParams,
    };
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(message, ...optionalParams);
    this.capture('LOG', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams);
    this.capture('ERROR', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, ...optionalParams);
    this.capture('WARN', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(message, ...optionalParams);
    this.capture('DEBUG', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    super.verbose(message, ...optionalParams);
    this.capture('VERBOSE', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    super.fatal(message, ...optionalParams);
    this.capture('FATAL', message, optionalParams);
  }
}
