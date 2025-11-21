import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = '@affirmation_analytics';

interface AffirmationAnalytics {
  id: string;
  accepted: number; // Times user swiped right
  rejected: number; // Times user swiped left
  replayed: number; // Times played in sessions
  favorited: boolean;
  lastShown: number; // Timestamp
  lastPlayed: number; // Timestamp
}

interface AnalyticsState {
  analytics: Record<string, AffirmationAnalytics>;
  favorites: Set<string>;
  loadAnalytics: () => Promise<void>;
  trackAccept: (id: string) => void;
  trackReject: (id: string) => void;
  trackReplay: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getMostReplayed: (limit?: number) => string[];
  getFavorites: () => string[];
  getRecommendations: (selectedIds: string[], limit?: number) => string[];
}

export const useAffirmationAnalyticsStore = create<AnalyticsState>((set, get) => ({
  analytics: {},
  favorites: new Set(),

  loadAnalytics: async () => {
    try {
      const data = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          analytics: parsed.analytics || {},
          favorites: new Set(parsed.favorites || []),
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  },

  trackAccept: (id: string) => {
    set((state) => {
      const analytics = { ...state.analytics };
      if (!analytics[id]) {
        analytics[id] = {
          id,
          accepted: 0,
          rejected: 0,
          replayed: 0,
          favorited: false,
          lastShown: Date.now(),
          lastPlayed: 0,
        };
      }
      analytics[id].accepted += 1;
      analytics[id].lastShown = Date.now();
      
      // Persist
      AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify({
        analytics,
        favorites: Array.from(state.favorites),
      }));

      return { analytics };
    });
  },

  trackReject: (id: string) => {
    set((state) => {
      const analytics = { ...state.analytics };
      if (!analytics[id]) {
        analytics[id] = {
          id,
          accepted: 0,
          rejected: 0,
          replayed: 0,
          favorited: false,
          lastShown: Date.now(),
          lastPlayed: 0,
        };
      }
      analytics[id].rejected += 1;
      analytics[id].lastShown = Date.now();
      
      // Persist
      AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify({
        analytics,
        favorites: Array.from(state.favorites),
      }));

      return { analytics };
    });
  },

  trackReplay: (id: string) => {
    set((state) => {
      const analytics = { ...state.analytics };
      if (!analytics[id]) {
        analytics[id] = {
          id,
          accepted: 0,
          rejected: 0,
          replayed: 0,
          favorited: false,
          lastShown: Date.now(),
          lastPlayed: Date.now(),
        };
      }
      analytics[id].replayed += 1;
      analytics[id].lastPlayed = Date.now();
      
      // Persist
      AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify({
        analytics,
        favorites: Array.from(state.favorites),
      }));

      return { analytics };
    });
  },

  toggleFavorite: (id: string) => {
    set((state) => {
      const favorites = new Set(state.favorites);
      const isFavorited = favorites.has(id);
      
      if (isFavorited) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }

      const analytics = { ...state.analytics };
      if (!analytics[id]) {
        analytics[id] = {
          id,
          accepted: 0,
          rejected: 0,
          replayed: 0,
          favorited: !isFavorited,
          lastShown: Date.now(),
          lastPlayed: 0,
        };
      } else {
        analytics[id].favorited = !isFavorited;
      }
      
      // Persist
      AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify({
        analytics,
        favorites: Array.from(favorites),
      }));

      return { favorites, analytics };
    });
  },

  getMostReplayed: (limit = 10) => {
    const { analytics } = get();
    return Object.values(analytics)
      .sort((a, b) => b.replayed - a.replayed)
      .slice(0, limit)
      .map(a => a.id);
  },

  getFavorites: () => {
    return Array.from(get().favorites);
  },

  getRecommendations: (selectedIds: string[], limit = 5) => {
    const { analytics } = get();
    const selectedSet = new Set(selectedIds);
    
    // Get affirmations similar to selected ones (same category logic would go here)
    // For now, return most replayed that aren't already selected
    return Object.values(analytics)
      .filter(a => !selectedSet.has(a.id))
      .sort((a, b) => b.replayed - a.replayed)
      .slice(0, limit)
      .map(a => a.id);
  },
}));





