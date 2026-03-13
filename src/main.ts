import 'dotenv/config';
import { join } from 'path';
import * as config from 'config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import fastifyHelmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import fastifyRateLimit from '@fastify/rate-limit';
import { Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModules } from 'src/app.module';
import { BodyValidationPipe } from 'src/shares/pipes/body.validation.pipe';
import { HttpExceptionFilter } from 'src/shares/filters/http-exception.filter';
import { SentryInterceptor } from 'src/shares/interceptors/sentry.interceptor';
import { ResponseTransformInterceptor } from 'src/shares/interceptors/response.interceptor';

const { name, port, prefix, node_env, sentry_dns } = config.get<any>('app');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModules,
    new FastifyAdapter({
      bodyLimit: 5 * 1024 * 1024,
    }),
  );
  Sentry.init({
    dsn: sentry_dns,
    environment: node_env,
  });
  app.enableCors();
  app.enableShutdownHooks();
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await app.register(fastifyCompress);
  await app.register(fastifyWebsocket);
  await app.register(fastifyMultipart, {
    limits: { fileSize: 50 * 1024 * 1024 },
  });
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'public/dashboard'),
    prefix: '/dashboard/',
  });
  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
    }),
  });
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(new BodyValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalInterceptors(
    new SentryInterceptor(),
    new ResponseTransformInterceptor(),
  );
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(name)
    .setVersion('0.0.1')
    .setDescription(`${name} description`)
    .setExternalDoc('Postman Collection', `/${prefix}/docs-json`)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    customSiteTitle: name,
    ui: node_env === 'development',
    swaggerOptions: {
      filter: true,
      deepLinking: true,
      deepScanRoutes: true,
      docExpansion: 'list',
      autoTagControllers: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: -1,
    },
  });
  await app
    .listen({
      port,
      host: '0.0.0.0',
    })
    .then(async () => {
      const logger = app.get(Logger);
      logger.debug(
        `Application is running on: ${await app.getUrl()}/${prefix}/docs/#/`,
      );
    });
}
bootstrap();
