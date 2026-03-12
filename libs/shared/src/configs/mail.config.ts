import { getConfig } from './index';

interface IEmailConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  service: string;
  enable: boolean;
}

export const mailConfig: IEmailConfig = {
  host: getConfig().get<string>('mail.host'),
  port: getConfig().get<number>('mail.port'),
  auth: {
    user: getConfig().get<string>('mail.account'),
    pass: getConfig().get<string>('mail.password'),
  },
  from: getConfig().get<string>('mail.from'),
  service: getConfig().get<string>('mail.service'),
  enable: getConfig().get<string>('mail.enable') === 'true',
};
