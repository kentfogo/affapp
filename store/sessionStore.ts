import { create } from 'zustand';
import { Affirmation } from '../types/affirmation';
import { SessionSettings, SessionState } from '../types/session';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface SessionStoreState {
  selectedAffirmations: Affirmation[];
  sessionSettings: SessionSettings | null;
  currentSession: SessionState | null;
  currentMoodEntryId: string | null;
  // Map-specific state
  isPanelExpanded: boolean;
  routePath: RouteCoordinate[];
  currentSpeed: number; // km/h or mph
  isSessionPaused: boolean;
  activityType: 'ride' | 'walk' | 'run';
  // Actions
  setSelectedAffirmations: (affirmations: Affirmation[]) => void;
  setSessionSettings: (settings: SessionSettings) => void;
  setMoodEntryId: (id: string | null) => void;
  startSession: () => void;
  endSession: () => void;
  updateSessionState: (updates: Partial<SessionState>) => void;
  // Map actions
  togglePanelExpanded: () => void;
  addLocationToRoute: (location: RouteCoordinate) => void;
  updateSpeed: (speed: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  setActivityType: (type: 'ride' | 'walk' | 'run') => void;
  resetMapState: () => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  selectedAffirmations: [],
  sessionSettings: null,
  currentSession: null,
  currentMoodEntryId: null,
  // Map-specific state
  isPanelExpanded: false,
  routePath: [],
  currentSpeed: 0,
  isSessionPaused: false,
  activityType: 'walk',
  // Actions
  setSelectedAffirmations: (affirmations) => set({ selectedAffirmations: affirmations }),
  setSessionSettings: (settings) => set({ sessionSettings: settings }),
  setMoodEntryId: (id) => set({ currentMoodEntryId: id }),
  startSession: () => {
    const startTime = Date.now();
    const freshSession = {
      startTime,
      duration: 0,
      distance: 0,
      affirmationsPlayed: [], // ← Empty array
      currentAffirmationIndex: 0,
      isActive: true,
    };
    
    console.log('🚀 Starting FRESH session');
    console.log('Initial affirmationsPlayed length:', freshSession.affirmationsPlayed.length);
    console.log('Should be 0:', freshSession.affirmationsPlayed.length === 0);
    
    set({
      currentSession: freshSession,
      routePath: [], // Reset route
      currentSpeed: 0,
      isSessionPaused: false,
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
        isPanelExpanded: false,
        isSessionPaused: false,
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
  // Map actions
  togglePanelExpanded: () => set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),
  addLocationToRoute: (location) => set((state) => ({
    routePath: [...state.routePath, location],
  })),
  updateSpeed: (speed) => set({ currentSpeed: speed }),
  pauseSession: () => set({ isSessionPaused: true }),
  resumeSession: () => set({ isSessionPaused: false }),
  setActivityType: (type) => set({ activityType: type }),
  resetMapState: () => set({
    isPanelExpanded: false,
    routePath: [],
    currentSpeed: 0,
    isSessionPaused: false,
  }),
}));

