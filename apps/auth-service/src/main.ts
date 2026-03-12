import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { AuthModule } from './auth.module';
import { SERVICE_PORTS } from '@app/shared/constants/services';

async function bootstrap(): Promise<void> {
  const logger = new Logger('AuthService');
  const port = SERVICE_PORTS.AUTH_SERVICE;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  logger.log(`Auth Service is listening on TCP port ${port}`);
}
bootstrap();
