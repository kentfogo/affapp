import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const CACHE_DIR = `${FileSystem.CacheDirectory}affirmations/`;
const CACHE_METADATA_KEY = '@cache_metadata';
const CACHE_LIMIT_MB = 150;
const CACHE_AGE_DAYS = 30;

interface CacheMetadata {
  id: string;
  downloadedAt: number;
  size: number; // in bytes
}

class CacheService {
  async initializeCache(): Promise<void> {
    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      
      // Clean expired cache
      await this.cleanExpiredCache();
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }

  async downloadAudio(affirmationId: string, audioUri: string): Promise<string | null> {
    try {
      // Check if already cached
      const cachedPath = await this.getCachedAudioPath(affirmationId);
      if (cachedPath) {
        return cachedPath;
      }

      // Check cache size before downloading
      if (!(await this.hasSpace())) {
        // Remove oldest files to make space
        await this.makeSpace(5 * 1024 * 1024); // Free up 5MB
      }

      // Download file
      const targetPath = `${CACHE_DIR}${affirmationId}.m4a`;
      const downloadResult = await FileSystem.downloadAsync(audioUri, targetPath);

      if (downloadResult.status === 200) {
        // Record metadata
        const fileInfo = await FileSystem.getInfoAsync(targetPath);
        await this.recordCacheMetadata(affirmationId, fileInfo.size);
        return targetPath;
      }
      return null;
    } catch (error) {
      console.error(`Error downloading audio for ${affirmationId}:`, error);
      return null;
    }
  }

  async getCachedAudioPath(affirmationId: string): Promise<string | null> {
    try {
      const path = `${CACHE_DIR}${affirmationId}.m4a`;
      const info = await FileSystem.getInfoAsync(path);
      return info.exists ? path : null;
    } catch {
      return null;
    }
  }

  private async recordCacheMetadata(id: string, size: number): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      metadata[id] = {
        id,
        downloadedAt: Date.now(),
        size,
      };
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error recording cache metadata:', error);
    }
  }

  private async getCacheMetadata(): Promise<Record<string, CacheMetadata>> {
    try {
      const data = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private async hasSpace(): Promise<boolean> {
    try {
      const currentSize = await this.getTotalCacheSize();
      return (currentSize / (1024 * 1024)) < CACHE_LIMIT_MB;
    } catch {
      return true; // Assume we have space on error
    }
  }

  private async makeSpace(requiredBytes: number): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const sorted = Object.values(metadata)
        .sort((a, b) => a.downloadedAt - b.downloadedAt);

      let freedBytes = 0;
      for (const file of sorted) {
        if (freedBytes >= requiredBytes) break;
        
        const filePath = `${CACHE_DIR}${file.id}.m4a`;
        try {
          await FileSystem.deleteAsync(filePath);
          freedBytes += file.size;
          
          // Remove from metadata
          delete metadata[file.id];
        } catch (error) {
          console.error(`Error deleting cache file ${file.id}:`, error);
        }
      }

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error making cache space:', error);
    }
  }

  private async cleanExpiredCache(): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const now = Date.now();
      const expireTime = CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
      
      for (const [id, data] of Object.entries(metadata)) {
        if (now - data.downloadedAt > expireTime) {
          try {
            const filePath = `${CACHE_DIR}${id}.m4a`;
            await FileSystem.deleteAsync(filePath);
            delete metadata[id];
          } catch (error) {
            console.error(`Error cleaning expired cache ${id}:`, error);
          }
        }
      }

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }

  private async getTotalCacheSize(): Promise<number> {
    try {
      const metadata = await this.getCacheMetadata();
      return Object.values(metadata).reduce((total, file) => total + file.size, 0);
    } catch {
      return 0;
    }
  }

  async getCacheSizeInMB(): Promise<number> {
    return (await this.getTotalCacheSize()) / (1024 * 1024);
  }

  async clearAllCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR);
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
}

export const cacheService = new CacheService();





