import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOOD_DATA_KEY = '@mood_data';

export type MoodRating = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  timestamp: number;
  preWorkout?: MoodRating;
  postWorkout?: MoodRating;
  sessionId?: string;
}

interface MoodState {
  moods: MoodEntry[];
  loadMoods: () => Promise<void>;
  savePreWorkoutMood: (rating: MoodRating, sessionId?: string) => Promise<string>;
  savePostWorkoutMood: (rating: MoodRating, entryId: string) => Promise<void>;
  getMoodImprovement: (entryId: string) => number | null;
  getWeeklyMoodReport: () => {
    averageImprovement: number;
    sessionsCount: number;
    improvementPercentage: number;
  };
  getMoodTrends: (days?: number) => MoodEntry[];
}

export const useMoodStore = create<MoodState>((set, get) => ({
  moods: [],

  loadMoods: async () => {
    try {
      const data = await AsyncStorage.getItem(MOOD_DATA_KEY);
      if (data) {
        set({ moods: JSON.parse(data) });
      }
    } catch (error) {
      console.error('Error loading moods:', error);
    }
  },

  savePreWorkoutMood: async (rating: MoodRating, sessionId?: string) => {
    const entry: MoodEntry = {
      id: `mood_${Date.now()}`,
      timestamp: Date.now(),
      preWorkout: rating,
      sessionId,
    };

    set((state) => {
      const updated = [...state.moods, entry];
      AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(updated));
      return { moods: updated };
    });

    return entry.id;
  },

  savePostWorkoutMood: async (rating: MoodRating, entryId: string) => {
    set((state) => {
      const updated = state.moods.map(mood =>
        mood.id === entryId
          ? { ...mood, postWorkout: rating }
          : mood
      );
      AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(updated));
      return { moods: updated };
    });
  },

  getMoodImprovement: (entryId: string) => {
    const entry = get().moods.find(m => m.id === entryId);
    if (entry?.preWorkout && entry?.postWorkout) {
      return entry.postWorkout - entry.preWorkout;
    }
    return null;
  },

  getWeeklyMoodReport: () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentMoods = get().moods.filter(m => m.timestamp > oneWeekAgo);
    
    const completed = recentMoods.filter(m => m.preWorkout && m.postWorkout);
    if (completed.length === 0) {
      return {
        averageImprovement: 0,
        sessionsCount: 0,
        improvementPercentage: 0,
      };
    }

    const improvements = completed.map(m => 
      (m.postWorkout! - m.preWorkout!) / m.preWorkout! * 100
    );
    const averageImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;

    return {
      averageImprovement,
      sessionsCount: completed.length,
      improvementPercentage: Math.round(averageImprovement),
    };
  },

  getMoodTrends: (days = 30) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return get().moods
      .filter(m => m.timestamp > cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);
  },
}));





