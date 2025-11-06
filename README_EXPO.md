# Mental Victory Practice - Expo React Native MVP

A cross-platform mobile app for personalized affirmations during movement sessions, built with Expo React Native, TypeScript, and Firebase.

## 🎯 Project Overview

**Mental Victory Practice** helps users hear personalized affirmations at intervals during active time (running, walking, cleaning, yoga, or active listening). The app supports time and distance-based intervals, TTS for provided affirmations, and recorded audio for custom affirmations.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Expo React Native (SDK 52)
- **Language**: TypeScript
- **Routing**: Expo Router (file-based)
- **State Management**: Zustand
- **Authentication**: Firebase Auth (email + anonymous guest mode)
- **Storage**: AsyncStorage (preferences) + SQLite (session logs)
- **Audio**: expo-av (playback) + expo-speech (TTS)
- **Location**: expo-location (distance tracking)
- **UI**: React Native + Expo components

### Project Structure
```
AffApp/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main app tabs
│   ├── onboarding.tsx     # Onboarding flow
│   ├── session.tsx        # Active session screen
│   └── summary.tsx        # Session summary
├── components/            # Reusable components
├── services/              # Business logic services
├── store/                 # Zustand state stores
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── data/                  # Static data (affirmations)
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on iOS/Android device (for testing)
- Firebase project (for authentication)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure Firebase**:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password and Anonymous)
   - Copy your Firebase config
   - Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```
   - Add your Firebase configuration to `.env`

3. **Start the development server**:
```bash
npm start
```

4. **Run on device**:
   - Scan QR code with Expo Go (iOS) or Expo Go (Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📱 Features

### Core Features
- ✅ User authentication (email + guest mode)
- ✅ Onboarding flow with preference collection
- ✅ 400+ affirmation bank with categories
- ✅ Affirmation selection (5-10 affirmations)
- ✅ Time-based intervals (30s, 60s, 90s, 2m, 3m, 5m)
- ✅ Distance-based intervals (0.25, 0.5, 1.0, 1.5, 2.0 mi/km)
- ✅ TTS playback for provided affirmations
- ✅ Audio recording support for custom affirmations
- ✅ Long-press stop (1200ms hold)
- ✅ Session tracking and history
- ✅ Positive reinforcement messages
- ✅ Offline persistence

### Permissions Required
- **Location** (foreground): For distance interval tracking
- **Microphone**: For recording custom affirmations
- **Audio**: For playback (automatically handled)

## 🧪 Testing Checklist

### Authentication Flow
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Continue as guest (anonymous auth)
- [ ] Sign out functionality

### Onboarding Flow
- [ ] Complete all 4 onboarding steps
- [ ] Select primary goal
- [ ] Select preferred categories
- [ ] Choose voice preference (TTS/recorded)
- [ ] Select distance unit (miles/kilometers)
- [ ] Data persists after app restart

### Affirmation Selection
- [ ] Browse affirmation library
- [ ] Search affirmations
- [ ] Select 5-10 affirmations
- [ ] Deselect affirmations
- [ ] Selection persists

### Session Flow
- [ ] Start session from home screen
- [ ] Time intervals trigger correctly
- [ ] Distance intervals work (with location permission)
- [ ] Affirmations play at intervals
- [ ] Current affirmation displays
- [ ] Timer updates correctly
- [ ] Distance tracking works (if enabled)
- [ ] Long-press stop (1200ms) ends session
- [ ] Session summary displays correctly
- [ ] Session log saved to history

### Edge Cases
- [ ] Location permission denied → falls back to time intervals
- [ ] No affirmations selected → prompts to select
- [ ] App backgrounded during session → handles gracefully
- [ ] Audio interruption → resumes correctly
- [ ] Network offline → app functions normally

### Accessibility
- [ ] Large touch targets (minimum 44x44pt)
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Readable font sizes (16pt minimum)
- [ ] VoiceOver/TalkBack support (basic)

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Session Settings
Default interval presets:
- **Time**: 30s, 60s, 90s, 2m, 3m, 5m
- **Distance**: 0.25, 0.5, 1.0, 1.5, 2.0 (miles or kilometers)

## 📝 Known Limitations

1. **Foreground-only**: App does not run in background (by design for MVP)
2. **No custom affirmation recording UI**: Recording functionality is prepared but UI not implemented
3. **No negativity screening**: Custom affirmations screening not implemented (requires Cloud Function)
4. **Basic distance smoothing**: Uses simple Haversine formula (no Kalman filtering)
5. **No audio focus handling**: May be interrupted by other apps
6. **Limited error recovery**: Basic error handling, may need enhancement

## 🎨 Positive Reinforcement Messages

The app includes 10 positive reinforcement messages shown after each session:
- "Amazing work! You're building positive momentum with every step."
- "You did it! Your commitment to growth is inspiring."
- "Fantastic! You're creating powerful change in your life."
- And 7 more variations...

## 🔒 Security Considerations

- Firebase Auth handles authentication securely
- No credentials stored client-side
- Input validation on user data
- Secure defaults for permissions
- Offline-first data storage

## 📦 Build for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## 🤝 Development Principles

This project follows:
- **DRY**: Don't Repeat Yourself
- **Security-First**: Secure defaults, input validation
- **Single Responsibility**: One function, one job
- **Framework Adherence**: Use Expo/Firebase ecosystem
- **Feature-Complete**: Finish one feature end-to-end before moving on

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## 🐛 Troubleshooting

### Common Issues

1. **Firebase not initializing**: Check `.env` file and Firebase project setup
2. **Location not working**: Ensure location permissions are granted
3. **Audio not playing**: Check device volume and audio permissions
4. **Build errors**: Clear cache with `expo start -c`

## 📄 License

[Your License Here]

---

**Built with ❤️ using Expo React Native**

