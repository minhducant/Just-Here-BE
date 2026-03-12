import { getConfig } from 'src/configs/index';

export const redisConfig: any = {
  host: getConfig().get<string>('redis.host'),
  port: getConfig().get<number>('redis.port'),
  password: getConfig().get<string>('redis.password') || undefined,
};
