import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SessionLog } from '../types/session';
import { Affirmation } from '../types/affirmation';

const SELECTED_AFFIRMATIONS_KEY = '@selected_affirmations';
const SESSION_SETTINGS_KEY = '@session_settings';
const SESSION_LOGS_KEY = '@session_logs';

// Conditionally import SQLite only for native platforms to avoid WASM bundling issues on web
let SQLite: typeof import('expo-sqlite') | null = null;
if (Platform.OS !== 'web') {
  try {
    SQLite = require('expo-sqlite');
  } catch (error) {
    console.warn('SQLite not available:', error);
  }
}

class StorageService {
  // @ts-expect-error - SQLite type may be null on web, but db is only used when SQLite exists
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    // Skip SQLite initialization on web
    if (Platform.OS === 'web' || !SQLite) {
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('sessions.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          startTime INTEGER NOT NULL,
          endTime INTEGER NOT NULL,
          duration INTEGER NOT NULL,
          distance REAL NOT NULL,
          affirmationsPlayed TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );
      `);
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // Affirmations
  async saveSelectedAffirmations(affirmations: Affirmation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SELECTED_AFFIRMATIONS_KEY,
        JSON.stringify(affirmations)
      );
    } catch (error) {
      console.error('Error saving affirmations:', error);
      throw error;
    }
  }

  async getSelectedAffirmations(): Promise<Affirmation[]> {
    try {
      const data = await AsyncStorage.getItem(SELECTED_AFFIRMATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading affirmations:', error);
      return [];
    }
  }

  // Session Settings
  async saveSessionSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SESSION_SETTINGS_KEY,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving session settings:', error);
      throw error;
    }
  }

  async getSessionSettings(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(SESSION_SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading session settings:', error);
      return null;
    }
  }

  // Session Logs - platform-aware implementation
  async saveSessionLog(session: SessionLog): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, store in AsyncStorage as JSON array
      try {
        const existingLogs = await this.getSessionLogs(session.userId);
        existingLogs.unshift(session); // Add to beginning
        // Keep only last 100 sessions
        const limitedLogs = existingLogs.slice(0, 100);
        await AsyncStorage.setItem(
          `${SESSION_LOGS_KEY}_${session.userId}`,
          JSON.stringify(limitedLogs)
        );
      } catch (error) {
        console.error('Error saving session log (web):', error);
        throw error;
      }
      return;
    }

    // Native: use SQLite
    if (!SQLite) {
      throw new Error('SQLite not available on this platform');
    }

    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `INSERT INTO sessions (id, userId, startTime, endTime, duration, distance, affirmationsPlayed, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.userId,
          session.startTime,
          session.endTime,
          session.duration,
          session.distance,
          JSON.stringify(session.affirmationsPlayed),
          session.createdAt,
        ]
      );
    } catch (error) {
      console.error('Error saving session log:', error);
      throw error;
    }
  }

  async getSessionLogs(userId: string, limit = 50): Promise<SessionLog[]> {
    if (Platform.OS === 'web') {
      // For web, retrieve from AsyncStorage
      try {
        const data = await AsyncStorage.getItem(`${SESSION_LOGS_KEY}_${userId}`);
        if (!data) {
          return [];
        }
        const logs: SessionLog[] = JSON.parse(data);
        return logs.slice(0, limit);
      } catch (error) {
        console.error('Error loading session logs (web):', error);
        return [];
      }
    }

    // Native: use SQLite
    if (!SQLite) {
      return [];
    }

    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      return [];
    }

    try {
      const result = await this.db.getAllAsync<SessionLog>(
        `SELECT * FROM sessions 
         WHERE userId = ? 
         ORDER BY createdAt DESC 
         LIMIT ?`,
        [userId, limit]
      );
      return result.map((row: any) => ({
        ...row,
        affirmationsPlayed: JSON.parse(row.affirmationsPlayed),
      }));
    } catch (error) {
      console.error('Error loading session logs:', error);
      return [];
    }
  }
}

export const storageService = new StorageService();

