export enum EmotionType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum EmotionValue {
  HAPPY = 'happy',
  GRATEFUL = 'grateful',
  EXCITED = 'excited',
  PROUD = 'proud',
  NORMAL = 'normal',
  CALM = 'calm',
  TIRED = 'tired',
  SAD = 'sad',
  ANGRY = 'angry',
  STRESSED = 'stressed',
  ANXIOUS = 'anxious',
  LONELY = 'lonely',
}

export const EMOTION_TYPE_MAP: Record<EmotionValue, EmotionType> = {
  [EmotionValue.HAPPY]: EmotionType.POSITIVE,
  [EmotionValue.GRATEFUL]: EmotionType.POSITIVE,
  [EmotionValue.EXCITED]: EmotionType.POSITIVE,
  [EmotionValue.PROUD]: EmotionType.POSITIVE,
  [EmotionValue.NORMAL]: EmotionType.NEUTRAL,
  [EmotionValue.CALM]: EmotionType.NEUTRAL,
  [EmotionValue.TIRED]: EmotionType.NEUTRAL,
  [EmotionValue.SAD]: EmotionType.NEGATIVE,
  [EmotionValue.ANGRY]: EmotionType.NEGATIVE,
  [EmotionValue.STRESSED]: EmotionType.NEGATIVE,
  [EmotionValue.ANXIOUS]: EmotionType.NEGATIVE,
  [EmotionValue.LONELY]: EmotionType.NEGATIVE,
};

export enum CheckinType {
  DAILY = 'daily',
  TRAVEL = 'travel',
}
