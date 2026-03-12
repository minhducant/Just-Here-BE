export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  admin = 0,
  user = 1,
}

export enum ThemeType {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM',
}

export enum CheckinType {
  DAILY = 'DAILY',
  TRAVEL = 'TRAVEL',
}

export enum CheckinTime {
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  TWELVE = 12,
  EIGHTEEN = 18,
  TWENTY = 20,
  TWENTY_TWO = 22,
}

export enum GracePeriod {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FIVE = 5,
  SEVEN = 7,
  FOURTEEN = 14,
  THIRTY = 30,
}

export const DEFAULT_CHECKIN_TIME = CheckinTime.NINE;
export const DEFAULT_GRACE_PERIOD = GracePeriod.FIVE;
