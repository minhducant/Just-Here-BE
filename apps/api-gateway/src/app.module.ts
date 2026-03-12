import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

import { SERVICES, SERVICE_PORTS } from '@app/shared/constants/services';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { CheckInController } from './controllers/check-in.controller';
import { ContactController } from './controllers/contact.controller';
import { NotificationController } from './controllers/notification.controller';
import { MailController } from './controllers/mail.controller';
import { UserAtStrategy } from './strategies/user-at.strategy';
import { UserRtStrategy } from './strategies/user-rt.strategy';
import { UserRolesGuard } from '@app/shared/guards/user-roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: SERVICES.USER_SERVICE,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.USER_SERVICE },
      },
      {
        name: SERVICES.AUTH_SERVICE,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.AUTH_SERVICE },
      },
      {
        name: SERVICES.CHECK_IN_SERVICE,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.CHECK_IN_SERVICE },
      },
      {
        name: SERVICES.CONTACT_SERVICE,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.CONTACT_SERVICE },
      },
      {
        name: SERVICES.NOTIFICATION_SERVICE,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.NOTIFICATION_SERVICE },
      },
      {
        name: SERVICES.MAIL_SERVICE,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.MAIL_SERVICE },
      },
    ]),
  ],
  controllers: [
    AuthController,
    UserController,
    CheckInController,
    ContactController,
    NotificationController,
    MailController,
  ],
  providers: [UserAtStrategy, UserRtStrategy, UserRolesGuard],
})
export class AppGatewayModule {}
