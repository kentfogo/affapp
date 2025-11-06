export type IntervalType = 'time' | 'distance';
export type DistanceUnit = 'miles' | 'kilometers';

export interface SessionSettings {
  intervalType: IntervalType;
  timeInterval?: number; // seconds
  distanceInterval?: number; // miles or km
  distanceUnit: DistanceUnit;
}

export interface SessionState {
  startTime: number;
  endTime?: number;
  duration: number; // seconds
  distance: number; // miles or km
  affirmationsPlayed: number[];
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
  affirmationsPlayed: number[];
  createdAt: number;
}

