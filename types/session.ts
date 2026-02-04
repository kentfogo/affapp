export type IntervalType = 'time' | 'distance';
export type DistanceUnit = 'miles' | 'kilometers';

export type RepetitionMode = 'sequential' | 'random';

// Google Cloud Neural2 voice presets for high-quality TTS
export type VoicePreset =
  | 'emma'      // en-US-Neural2-C - Warm, encouraging, professional (Female)
  | 'aria'      // en-US-Neural2-E - Friendly, energetic, clear (Female)
  | 'luna'      // en-US-Neural2-F - Calm, soothing, therapeutic (Female)
  | 'james'     // en-US-Neural2-D - Deep, confident, motivational (Male)
  | 'ryan'      // en-US-Neural2-A - Friendly, supportive, coach-like (Male)
  | 'marcus';   // en-US-Neural2-J - Professional, clear, athletic (Male)

export interface SessionSettings {
  intervalType: IntervalType;
  timeInterval?: number; // seconds
  distanceInterval?: number; // miles or km
  distanceUnit: DistanceUnit;
  volume: number; // 0-100
  repetitionMode: RepetitionMode;
  playChime: boolean;
  voicePreset: VoicePreset;
}

export interface SessionState {
  startTime: number;
  endTime?: number;
  duration: number; // seconds
  distance: number; // miles or km
  affirmationsPlayed: string[];
  currentAffirmationIndex: number;
  isActive: boolean;
}

export interface SessionLog {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  affirmationsPlayed: string[];
  createdAt: number;
}

