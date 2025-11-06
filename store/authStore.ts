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
  // Listen to auth state changes
  onAuthStateChanged(auth, (user) => {
    set({ user, isLoading: false });
  });

  return {
    user: null,
    isLoading: true,
    error: null,
    setUser: (user) => set({ user }),
    signInAnonymously: async () => {
      try {
        set({ isLoading: true, error: null });
        await signInAnonymously(auth);
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    signInWithEmail: async (email: string, password: string) => {
      try {
        set({ isLoading: true, error: null });
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      try {
        set({ isLoading: true, error: null });
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    signOut: async () => {
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

