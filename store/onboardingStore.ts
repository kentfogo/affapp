import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_complete';
const ONBOARDING_DATA_KEY = '@onboarding_data';

export interface OnboardingData {
  primaryGoal: string;
  preferredCategories: string[];
  voicePreference: 'tts' | 'recorded';
  unitPreference: 'miles' | 'kilometers';
  timeOfDay?: string;
}

interface OnboardingState {
  isComplete: boolean;
  isLoading: boolean;
  data: OnboardingData | null;
  loadOnboarding: () => Promise<void>;
  saveOnboarding: (data: OnboardingData) => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isComplete: false,
  isLoading: true,
  data: null,
  loadOnboarding: async () => {
    try {
      const [complete, data] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(ONBOARDING_DATA_KEY),
      ]);
      set({
        isComplete: complete === 'true',
        data: data ? JSON.parse(data) : null,
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
  reset: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_KEY),
        AsyncStorage.removeItem(ONBOARDING_DATA_KEY),
      ]);
      set({ isComplete: false, data: null });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  },
}));

