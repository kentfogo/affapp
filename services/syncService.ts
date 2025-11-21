import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineStore } from '../store/offlineStore';

const PENDING_SYNC_KEY = '@pending_sync';

interface PendingSync {
  id: string;
  type: 'affirmation_selection' | 'session_log' | 'preferences';
  data: any;
  timestamp: number;
}

class SyncService {
  private syncInProgress = false;

  async queueSync(type: PendingSync['type'], data: any): Promise<void> {
    try {
      const pending = await this.getPendingSync();
      const id = `${type}_${Date.now()}`;
      pending.push({ id, type, data, timestamp: Date.now() });
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Error queuing sync:', error);
    }
  }

  async syncIfOnline(): Promise<boolean> {
    const { isOnline } = useOfflineStore.getState();
    
    if (!isOnline || this.syncInProgress) {
      return false;
    }

    return await this.performSync();
  }

  private async performSync(): Promise<boolean> {
    this.syncInProgress = true;
    try {
      const pending = await this.getPendingSync();
      
      if (pending.length === 0) {
        return true;
      }

      // Group by type for efficient syncing
      const grouped = this.groupPendingByType(pending);

      for (const [type, items] of Object.entries(grouped)) {
        // TODO: Implement actual sync to Firebase
        // await this.syncToFirebase(type, items);
        
        // For now, just clear the queue (in production, only clear after success)
        await this.clearPendingSync(items.map((i: any) => i.id));
      }

      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private groupPendingByType(pending: PendingSync[]): Record<string, PendingSync[]> {
    return pending.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, PendingSync[]>);
  }

  private async getPendingSync(): Promise<PendingSync[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async clearPendingSync(ids: string[]): Promise<void> {
    try {
      const pending = await this.getPendingSync();
      const filtered = pending.filter(p => !ids.includes(p.id));
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error clearing pending sync:', error);
    }
  }

  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingSync();
    return pending.length;
  }
}

export const syncService = new SyncService();





