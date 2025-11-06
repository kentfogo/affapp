import { create } from 'zustand';
import { Affirmation } from '../types/affirmation';
import { SessionSettings, SessionState } from '../types/session';

interface SessionStoreState {
  selectedAffirmations: Affirmation[];
  sessionSettings: SessionSettings | null;
  currentSession: SessionState | null;
  setSelectedAffirmations: (affirmations: Affirmation[]) => void;
  setSessionSettings: (settings: SessionSettings) => void;
  startSession: () => void;
  endSession: () => void;
  updateSessionState: (updates: Partial<SessionState>) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  selectedAffirmations: [],
  sessionSettings: null,
  currentSession: null,
  setSelectedAffirmations: (affirmations) => set({ selectedAffirmations: affirmations }),
  setSessionSettings: (settings) => set({ sessionSettings: settings }),
  startSession: () => {
    const startTime = Date.now();
    set({
      currentSession: {
        startTime,
        duration: 0,
        distance: 0,
        affirmationsPlayed: [],
        currentAffirmationIndex: 0,
        isActive: true,
      },
    });
  },
  endSession: () => {
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          isActive: false,
          endTime: Date.now(),
        },
      };
    });
  },
  updateSessionState: (updates) => {
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          ...updates,
        },
      };
    });
  },
}));

