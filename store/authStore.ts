import { create } from 'zustand';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen to auth state changes (only if auth is initialized)
  if (auth) {
    try {
      onAuthStateChanged(auth, (user) => {
        set({ user, isLoading: false });
      });
    } catch (error) {
      console.warn('Failed to set up auth state listener:', error);
      set({ isLoading: false });
    }
  } else {
    // If auth is not initialized, set loading to false
    set({ isLoading: false });
  }

  return {
    user: null,
    isLoading: true,
    error: null,
    setUser: (user) => set({ user }),
    signInAnonymously: async () => {
      if (!auth) {
        const error = new Error('Firebase Auth is not initialized');
        set({ error: error.message, isLoading: false });
        throw error;
      }
      try {
        set({ isLoading: true, error: null });
        await signInAnonymously(auth);
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    signInWithEmail: async (email: string, password: string) => {
      if (!auth) {
        const error = new Error('Firebase Auth is not initialized');
        set({ error: error.message, isLoading: false });
        throw error;
      }
      try {
        set({ isLoading: true, error: null });
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      if (!auth) {
        const error = new Error('Firebase Auth is not initialized');
        set({ error: error.message, isLoading: false });
        throw error;
      }
      try {
        set({ isLoading: true, error: null });
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    signOut: async () => {
      if (!auth) {
        set({ user: null, isLoading: false });
        return;
      }
      try {
        set({ isLoading: true, error: null });
        await firebaseSignOut(auth);
        set({ user: null });
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
  };
});

