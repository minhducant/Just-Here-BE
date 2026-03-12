import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { MailModule } from './mail.module';
import { SERVICE_PORTS } from '@app/shared/constants/services';

async function bootstrap(): Promise<void> {
  const logger = new Logger('MailService');
  const port = SERVICE_PORTS.MAIL_SERVICE;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MailModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port },
    },
  );

  await app.listen();
  logger.log(`Mail Service is listening on TCP port ${port}`);
}
bootstrap();
