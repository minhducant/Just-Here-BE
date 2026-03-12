export const httpErrors = {
  // USER
  ACCOUNT_NOT_FOUND: { message: 'Account not found.', code: 'USER_00000' },
  ACCOUNT_EXISTED: { message: 'Account already existed.', code: 'USER_00001' },
  UNAUTHORIZED: { message: 'Unauthorized user.', code: 'USER_00003' },
  USER_BANNED: { message: 'User has been banned.', code: 'USER_00004' },
  USER_UNVERIFIED: { message: 'Unverified user.', code: 'USER_00005' },
  REFRESH_TOKEN_EXPIRED: { message: 'Refresh tokens is expired.', code: 'USER_00007' },
  ACCESS_TOKEN_EXPIRED: { message: 'Access token is expired.', code: 'USER_00008' },
  FORBIDDEN: { message: 'You are not authorized to access this resource.', code: 'USER_00009' },
  // SOCIAL
  FACEBOOK_TOKEN_INVALID_OR_EXPIRES: { message: 'Access token is invalid or expires.', code: 'FACEBOOK_00000' },
  GOOGLE_TOKEN_INVALID_OR_EXPIRES: { message: 'Access token is invalid or expires.', code: 'GOOGLE_00000' },
  ZALO_TOKEN_INVALID_OR_EXPIRES: { message: 'Access token is invalid or expires.', code: 'ZALO_00000' },
  APPLE_TOKEN_INVALID_OR_EXPIRES: { message: 'identityToken is invalid or expires.', code: 'APPLE_00000' },
  LINE_TOKEN_INVALID_OR_EXPIRES: { message: 'Access token is invalid or expires.', code: 'LINE_00000' },
};
