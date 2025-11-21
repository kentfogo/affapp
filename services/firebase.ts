import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence, Auth } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Check if API key is loaded (remove after troubleshooting)
if (!firebaseConfig.apiKey) {
  console.warn('⚠️ Firebase API key is missing! Check your .env file.');
} else {
  console.log('✅ Firebase API key is loaded (length:', firebaseConfig.apiKey.length, ')');
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Initialize Firebase with error handling to prevent route loading failures
try {
  // Initialize Firebase app if not already initialized
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Auth with platform-specific persistence
  try {
    if (Platform.OS === 'web') {
      // For web, getAuth() defaults to browser persistence
      // No need to use initializeAuth with explicit persistence
      auth = getAuth(app);
    } else {
      // Use React Native persistence for iOS/Android
      // Dynamically require to avoid web bundling issues
      const { getReactNativePersistence } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  } catch (initError: any) {
    // If initializeAuth fails, only use getAuth if auth is already initialized
    // For other errors (like invalid-api-key), don't fall back to getAuth
    // as it won't have AsyncStorage persistence
    if (initError.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      // For other errors (invalid-api-key, etc.), don't fall back
      // This prevents the AsyncStorage warning from appearing
      console.warn('Firebase Auth initialization failed:', initError.code || initError.message);
      throw initError; // Re-throw to be caught by outer catch
    }
  }
} catch (error) {
  // Handle all initialization errors gracefully
  // This prevents Firebase errors from crashing route discovery
  console.warn('Firebase initialization error (non-fatal):', error);
  
  // Try to get existing instances as fallback
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      auth = getAuth(app);
    }
  } catch (fallbackError) {
    console.warn('Firebase fallback initialization failed:', fallbackError);
    // App will continue to load, but Firebase features won't work
    // This allows routes to load successfully
  }
}

// Ensure we have valid instances (even if null, which allows app to continue)
export { app, auth };

