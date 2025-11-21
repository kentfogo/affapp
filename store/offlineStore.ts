import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  initializeNetworkListener: () => void;
  triggerSync: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,

  initializeNetworkListener: async () => {
    // Check initial status
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected ?? true;
    set({ isOnline: isConnected });

    // If coming online, trigger sync
    if (isConnected) {
      await get().triggerSync();
    }

    // Listen for changes
    NetInfo.addEventListener(state => {
      const wasOnline = get().isOnline;
      const nowOnline = state.isConnected ?? false;

      set({ isOnline: nowOnline });

      // If just came online, trigger sync
      if (!wasOnline && nowOnline) {
        get().triggerSync();
      }
    });
  },

  triggerSync: async () => {
    set({ isSyncing: true });
    try {
      const success = await syncService.syncIfOnline();
      if (success) {
        set({ lastSyncTime: Date.now() });
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      set({ isSyncing: false });
    }
  },
}));





