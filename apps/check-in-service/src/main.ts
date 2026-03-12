import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { CheckInModule } from './check-in.module';
import { SERVICE_PORTS } from '@app/shared/constants/services';

async function bootstrap(): Promise<void> {
  const logger = new Logger('CheckInService');
  const port = SERVICE_PORTS.CHECK_IN_SERVICE;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CheckInModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  logger.log(`Check-In Service is listening on TCP port ${port}`);
}
bootstrap();
