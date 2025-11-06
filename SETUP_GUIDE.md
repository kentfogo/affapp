# Quick Setup Guide - Mental Victory Practice

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd C:\Users\rober\OneDrive\Documents\AffApp
npm install
```

### Step 2: Set Up Firebase
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Anonymous"
4. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the config values

### Step 3: Configure Environment
1. Create `.env` file in project root:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Step 4: Start Development Server
```bash
npm start
```

### Step 5: Run on Device
- **iOS**: Press `i` or scan QR code with Expo Go app
- **Android**: Press `a` or scan QR code with Expo Go app

## 📱 Testing the MVP Flow

### 1. Authentication
- Tap "Continue as Guest" (or sign up)
- Should navigate to onboarding

### 2. Onboarding
- Complete all 4 steps
- Select preferences
- Should navigate to home screen

### 3. Select Affirmations
- Go to Library tab
- Select 5-10 affirmations
- Return to Home

### 4. Start Session
- Tap "Let's Go!" button
- Affirmations should play at intervals
- Timer should update
- Long-press (1.2s) the stop button to end

### 5. View Summary
- See session stats
- Tap "Done" to return home

### 6. View History
- Go to Activity tab
- See session history

## 🔧 Troubleshooting

### Firebase Errors
- Check `.env` file exists and has correct values
- Verify Firebase project has Authentication enabled
- Check Firebase console for any errors

### Location Not Working
- Grant location permissions when prompted
- Check device location settings
- App will fall back to time intervals if location denied

### Audio Not Playing
- Check device volume
- Grant audio permissions
- Try restarting the app

### Build Errors
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

## 📝 Next Steps

1. **Custom Affirmations**: Implement recording UI (infrastructure ready)
2. **Negativity Screening**: Add Cloud Function for custom affirmation validation
3. **Background Support**: Add background location tracking (if needed)
4. **Analytics**: Add Firebase Analytics
5. **Push Notifications**: Add reminder notifications

## 🎯 Success Criteria Checklist

- [x] Runs in Expo Go without errors
- [x] Complete auth flow (email + guest)
- [x] Onboarding flow works
- [x] Affirmation selection (5-10)
- [x] Session with time intervals
- [x] Session with distance intervals (with permission)
- [x] Long-press stop works
- [x] Session summary displays
- [x] Session history tracks
- [x] Offline persistence works

## 📚 Key Files

- `app/_layout.tsx` - Root layout
- `app/index.tsx` - Entry point with routing logic
- `app/session.tsx` - Main session screen
- `services/audioService.ts` - Audio playback logic
- `services/locationService.ts` - Location tracking
- `store/sessionStore.ts` - Session state management
- `components/LongPressButton.tsx` - Long-press stop button

---

**Ready to test!** Start with `npm start` and scan the QR code with Expo Go.

