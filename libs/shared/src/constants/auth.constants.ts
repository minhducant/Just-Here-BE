import * as config from 'config';

export const JWT_CONSTANTS = {
  userAccessTokenSecret: config.get<string>('app.user_jwt_access_token_secret'),
  userAccessTokenExpiry: parseInt(
    config.get<string>('app.user_jwt_access_token_expiration_time'),
  ),
  userRefreshTokenSecret: config.get<string>('app.user_jwt_refresh_token_secret'),
  userRefreshTokenExpiry: parseInt(
    config.get<string>('app.user_jwt_refresh_token_expiration_time'),
  ),
};

export const USER_AUTH_CACHE_PREFIX = 'USER_AUTH_CACHE_PREFIX_';
