<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Environment configuration

Copy `.env.example` to `.env` (or set environment variables directly) before running the project:

```bash
cp .env.example .env
```

---

## MailService

Located at `src/modules/mail/`.

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `MAIL_ENABLE` | Enable/disable email sending (`true`/`false`) | `false` |
| `MAIL_HOST` | SMTP server hostname | `smtp.example.com` |
| `MAIL_PORT` | SMTP server port (587 for TLS, 465 for SSL) | `587` |
| `MAIL_ACCOUNT` | SMTP username | `user@example.com` |
| `MAIL_PASSWORD` | SMTP password | `secret` |
| `MAIL_FROM` | Sender address shown in emails | `"App <no-reply@example.com>"` |
| `MAIL_SERVICE` | Optional well-known service name (`gmail`, `outlook`, …). If set, `MAIL_HOST`/`MAIL_PORT` are ignored by the transport. | _(empty)_ |

### Usage examples

#### Inject into any service/controller

```typescript
import { MailService } from 'src/modules/mail/mail.service';

@Injectable()
export class MyService {
  constructor(private readonly mailService: MailService) {}

  async example() {
    // Send plain-text email
    await this.mailService.sendTextMail(
      'user@example.com',
      'Welcome!',
      'Thanks for joining Just-Here.',
    );

    // Send HTML email
    await this.mailService.sendHtmlMail(
      'user@example.com',
      'Your report is ready',
      '<h1>Report</h1><p>Please find your report attached.</p>',
    );

    // Full control via SendMailDto
    await this.mailService.sendMail({
      to: 'user@example.com',
      subject: 'Meeting reminder',
      html: '<p>Don\'t forget the meeting at 3 PM.</p>',
      cc: ['manager@example.com'],
      bcc: ['archive@example.com'],
    });
  }
}
```

#### Import MailModule into another module

```typescript
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [MyService],
})
export class MyModule {}
```

---

## NotificationService

Located at `src/modules/notification/`.

The service handles **in-app notifications** (stored in MongoDB) and **Firebase push notifications**.

### Features

| Feature | Endpoint |
|---|---|
| Get notifications for current user (paginated) | `GET /notification` |
| Push notification to a user | `POST /notification/push` |
| Mark single notification as read | `POST /notification/read` |
| Mark all notifications as read | `POST /notification/read-all` |
| Register device push token | `POST /notification/register` |
| Delete notification | `DELETE /notification/:id` |

### Usage examples (from another service)

```typescript
import { NotificationService } from 'src/modules/notification/notification.service';

@Injectable()
export class MyService {
  constructor(private readonly notificationService: NotificationService) {}

  async example() {
    // Send push notification + save to DB
    await this.notificationService.sendNotification({
      user_id: '65e1711ef5f60e3a0f3ce603',
      title: 'New message',
      body: 'You have a new message from Alice.',
      data: { type: 'message', id: '65f2cd9fd8c74ec326027960' },
    });

    // Send push notification AND email in one call
    await this.notificationService.sendNotificationWithEmail(
      {
        user_id: '65e1711ef5f60e3a0f3ce603',
        title: 'New message',
        body: 'You have a new message from Alice.',
        data: {},
      },
      { to: 'user@example.com', emailSubject: 'New message on Just-Here' },
    );
  }
}
```

---

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
