import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_complete';
const ONBOARDING_DATA_KEY = '@onboarding_data';
const SELECTED_AFFIRMATIONS_KEY = '@selected_affirmations';

export interface OnboardingData {
  primaryGoal?: string; // Optional, kept for backward compatibility
  preferredCategories: string[];
  voicePreference: 'tts' | 'recorded';
  unitPreference: 'miles' | 'kilometers';
  timeOfDay?: string;
}

interface OnboardingState {
  isComplete: boolean;
  isLoading: boolean;
  data: OnboardingData | null;
  selectedAffirmationIds: string[];
  loadOnboarding: () => Promise<void>;
  saveOnboarding: (data: OnboardingData) => Promise<void>;
  saveSelectedAffirmations: (ids: string[]) => Promise<void>;
  loadSelectedAffirmations: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isComplete: false,
  isLoading: true,
  data: null,
  selectedAffirmationIds: [],

  loadOnboarding: async () => {
    try {
      const [complete, data, affirmations] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(ONBOARDING_DATA_KEY),
        AsyncStorage.getItem(SELECTED_AFFIRMATIONS_KEY),
      ]);
      set({
        isComplete: complete === 'true',
        data: data ? JSON.parse(data) : null,
        selectedAffirmationIds: affirmations ? JSON.parse(affirmations) : [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading onboarding:', error);
      set({ isLoading: false });
    }
  },

  saveOnboarding: async (data: OnboardingData) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
        AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data)),
      ]);
      set({ isComplete: true, data });
    } catch (error) {
      console.error('Error saving onboarding:', error);
      throw error;
    }
  },

  saveSelectedAffirmations: async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(SELECTED_AFFIRMATIONS_KEY, JSON.stringify(ids));
      set({ selectedAffirmationIds: ids });
    } catch (error) {
      console.error('Error saving selected affirmations:', error);
      throw error;
    }
  },

  loadSelectedAffirmations: async () => {
    try {
      const data = await AsyncStorage.getItem(SELECTED_AFFIRMATIONS_KEY);
      set({ selectedAffirmationIds: data ? JSON.parse(data) : [] });
    } catch (error) {
      console.error('Error loading selected affirmations:', error);
    }
  },

  reset: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_KEY),
        AsyncStorage.removeItem(ONBOARDING_DATA_KEY),
        AsyncStorage.removeItem(SELECTED_AFFIRMATIONS_KEY),
      ]);
      set({ isComplete: false, data: null, selectedAffirmationIds: [] });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  },
}));

