export enum MoodType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum MoodValue {
  // Positive
  HAPPY = 'happy',
  EXCITED = 'excited',

  // Neutral
  NEUTRAL = 'neutral',

  // Negative
  SAD = 'sad',
  FRUSTRATED = 'frustrated',
}

export const MOOD_TYPE_MAP: Record<MoodValue, MoodType> = {
  // Positive
  [MoodValue.HAPPY]: MoodType.POSITIVE,
  [MoodValue.EXCITED]: MoodType.POSITIVE,

  // Neutral
  [MoodValue.NEUTRAL]: MoodType.NEUTRAL,

  // Negative
  [MoodValue.SAD]: MoodType.NEGATIVE,
  [MoodValue.FRUSTRATED]: MoodType.NEGATIVE,
};

export enum CheckinType {
  DAILY = 'daily',
  TRAVEL = 'travel',
}
