import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { UserModule } from './user.module';
import { SERVICE_PORTS } from '@app/shared/constants/services';

async function bootstrap(): Promise<void> {
  const logger = new Logger('UserService');
  const port = SERVICE_PORTS.USER_SERVICE;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  logger.log(`User Service is listening on TCP port ${port}`);
}
bootstrap();
