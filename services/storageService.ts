import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { SessionLog } from '../types/session';
import { Affirmation } from '../types/affirmation';

const SELECTED_AFFIRMATIONS_KEY = '@selected_affirmations';
const SESSION_SETTINGS_KEY = '@session_settings';

class StorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
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

  // Session Logs
  async saveSessionLog(session: SessionLog): Promise<void> {
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

