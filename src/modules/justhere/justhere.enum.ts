export enum EmotionType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum EmotionValue {
  // Positive
  HAPPY = 'happy',
  GRATEFUL = 'grateful',
  EXCITED = 'excited',
  PROUD = 'proud',

  // Neutral
  NORMAL = 'normal',
  CALM = 'calm',
  TIRED = 'tired',

  // Negative
  SAD = 'sad',
  ANGRY = 'angry',
  STRESSED = 'stressed',
  ANXIOUS = 'anxious',
  LONELY = 'lonely',
}

export const EMOTION_TYPE_MAP: Record<EmotionValue, EmotionType> = {
  // Positive
  [EmotionValue.HAPPY]: EmotionType.POSITIVE,
  [EmotionValue.GRATEFUL]: EmotionType.POSITIVE,
  [EmotionValue.EXCITED]: EmotionType.POSITIVE,
  [EmotionValue.PROUD]: EmotionType.POSITIVE,

  // Neutral
  [EmotionValue.NORMAL]: EmotionType.NEUTRAL,
  [EmotionValue.CALM]: EmotionType.NEUTRAL,
  [EmotionValue.TIRED]: EmotionType.NEUTRAL,

  // Negative
  [EmotionValue.SAD]: EmotionType.NEGATIVE,
  [EmotionValue.ANGRY]: EmotionType.NEGATIVE,
  [EmotionValue.STRESSED]: EmotionType.NEGATIVE,
  [EmotionValue.ANXIOUS]: EmotionType.NEGATIVE,
  [EmotionValue.LONELY]: EmotionType.NEGATIVE,
};

export enum JustHereType {
  DAILY = 'daily',
  TRAVEL = 'travel',
}
