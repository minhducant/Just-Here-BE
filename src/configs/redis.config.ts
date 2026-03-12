import { createKeyv } from '@keyv/redis';
import { getConfig } from 'src/configs/index';

export const redisConfig: any = {
  host: getConfig().get<string>('redis.host'),
  port: getConfig().get<number>('redis.port'),
  password: getConfig().get<string>('redis.password') || undefined,
};

export const createRedisStore = () =>
  createKeyv({
    socket: { host: redisConfig.host, port: redisConfig.port },
    password: redisConfig.password,
  }) as any;
