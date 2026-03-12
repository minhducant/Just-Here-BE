import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { mongodb } from '@app/shared/configs/database.config';
import { serviceAccount } from '@app/shared/configs/firebase.config';
import { User, UserSchema } from '@app/shared/schemas/user.schema';
import { Notification, NotificationSchema } from '@app/shared/schemas/notification.schema';
import { NotificationToken, NotificationTokenSchema } from '@app/shared/schemas/notification-token.schema';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(mongodb.uri, mongodb.options),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationToken.name, schema: NotificationTokenSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
  }
}
