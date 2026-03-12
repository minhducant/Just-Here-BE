export const USER_PATTERNS = {
  FIND_ALL: 'user.findAll',
  FIND_BY_ID: 'user.findById',
  FIND_ONE: 'user.findOne',
  UPDATE: 'user.update',
  DELETE: 'user.delete',
  ADD_FIREBASE_TOKEN: 'user.addFirebaseToken',
  FIND_OR_CREATE_GOOGLE: 'user.findOrCreateGoogle',
  FIND_OR_CREATE_FACEBOOK: 'user.findOrCreateFacebook',
  FIND_OR_CREATE_ZALO: 'user.findOrCreateZalo',
  FIND_OR_CREATE_APPLE: 'user.findOrCreateApple',
  FIND_OR_CREATE_LINE: 'user.findOrCreateLine',
};

export const AUTH_PATTERNS = {
  REFRESH_TOKEN: 'auth.refreshToken',
  LOGIN_GOOGLE: 'auth.loginGoogle',
  LOGIN_FACEBOOK: 'auth.loginFacebook',
  LOGIN_APPLE: 'auth.loginApple',
  LOGIN_ZALO: 'auth.loginZalo',
  LOGIN_LINE: 'auth.loginLine',
};

export const CHECK_IN_PATTERNS = {
  FIND: 'checkin.find',
  CREATE: 'checkin.create',
  UPDATE: 'checkin.update',
  RUN_CRON: 'checkin.runCron',
};

export const CONTACT_PATTERNS = {
  FIND: 'contact.find',
  CREATE: 'contact.create',
  UPDATE: 'contact.update',
  DELETE: 'contact.delete',
};

export const NOTIFICATION_PATTERNS = {
  GET: 'notification.get',
  SEND: 'notification.send',
  REGISTER: 'notification.register',
  READ_BY_ID: 'notification.readById',
  READ_ALL: 'notification.readAll',
  DELETE: 'notification.delete',
};

export const MAIL_PATTERNS = {
  SEND: 'mail.send',
};
