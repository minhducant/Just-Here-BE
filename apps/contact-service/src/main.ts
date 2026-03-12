import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { ContactModule } from './contact.module';
import { SERVICE_PORTS } from '@app/shared/constants/services';

async function bootstrap(): Promise<void> {
  const logger = new Logger('ContactService');
  const port = SERVICE_PORTS.CONTACT_SERVICE;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ContactModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port },
    },
  );

  await app.listen();
  logger.log(`Contact Service is listening on TCP port ${port}`);
}
bootstrap();
