# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mental Victory Practice is a React Native (Expo) mobile app that plays personalized affirmations at intervals during movement sessions (walking, running, cycling, yoga).

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Firebase (Auth/Firestore/Storage), Zustand for state management, Expo Router for navigation.

**Note:** The README.md mentions Flutter but the actual implementation uses React Native/Expo.

## Common Commands

```bash
npm start          # Launch Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser (expo start --web)
```

No test runner or linter is configured.

## Architecture

### Routing (Expo Router v6, file-based)

- `app/index.tsx` — Auth/onboarding router: no user → `/(auth)/login`, user without onboarding → `/onboarding`, otherwise → `/(tabs)/home`
- `app/(tabs)/` — Five tabs: **home**, **affirmations** (labeled "Mantras"), **you**, **settings**, **list**
- `app/session.tsx` — Core session experience (affirmation playback loop)
- `app/summary.tsx` — Post-session stats
- `app/congratulations.tsx` — First session celebration
- `app/onboarding.tsx` — 3-step setup (categories, voice, units)

### State Management (Zustand)

All stores in `store/`. Pattern: plain `create<T>((set, get) => ...)` with **manual AsyncStorage persistence** (no zustand/persist middleware). Each store has its own `loadFromStorage`/`saveToStorage` methods with `@`-prefixed keys (e.g., `@mood_data`, `@affirmation_analytics`).

Key stores:
- `sessionStore` — Transient session state (no persistence). Selected affirmations, interval settings, map/GPS state, pause state.
- `authStore` — Firebase Auth listener. Initializes differently on web vs native.
- `onboardingStore` — Persists completion status, user preferences (categories, voice, units).
- `affirmationAnalyticsStore` — Tracks accepts, rejects, replays, favorites per affirmation.
- `moodStore` — Pre/post workout mood ratings (1-5 scale).

### Services

All services are **singleton class instances** (e.g., `export const audioService = new AudioService()`).

- `audioService.ts` — Multi-tier playback: bundled MP3 → custom recording → device TTS fallback. See Voice System below.
- `storageService.ts` — Platform-aware: SQLite on native, AsyncStorage on web. Session logs stored here.
- `locationService.ts` — GPS tracking with Haversine distance calc, triggers affirmations at distance milestones.
- `recommendationService.ts` — Bayesian Thompson Sampling engine. **Fully implemented but DORMANT** (not wired to session flow).
- `syncService.ts` — Offline sync queue. **Stub** (sync-to-Firebase logic not implemented).

### Session Flow

1. Session validates settings + selected affirmations from `sessionStore`
2. Audio initialized with volume/voice from settings
3. Interval trigger: time-based (`setInterval`) or distance-based (GPS `watchPositionAsync`)
4. Each trigger cycles through affirmations: update display → track analytics → play audio
5. Pause: hold-to-pause (1.5s), 2s cooldown before end-session enabled
6. End: stop tracking/audio → save `SessionLog` (SQLite native, AsyncStorage web) → navigate to `/congratulations` (first) or `/summary`

## Platform-Specific Patterns

This codebase runs on iOS, Android, and web. Three patterns handle platform differences:

### 1. Conditional require (most common)
```typescript
let SQLite: typeof import('expo-sqlite') | null = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}
```
Used in: `storageService.ts`, `firebase.ts` (auth persistence differs web vs native)

### 2. Platform file extensions
Metro automatically resolves `.native.tsx` vs `.web.tsx`:
- `MapSessionScreen.native.tsx` — react-native-maps implementation
- `MapSessionScreen.web.tsx` — fallback/placeholder

### 3. Metro empty module resolution (`metro.config.js`)
Native-only modules excluded from web bundle:
```javascript
// react-native-maps and expo-speech-recognition → { type: 'empty' } on web
```

**Always check `Platform.OS` before using**: Haptics, Maps, Speech Recognition, SQLite, Location background tasks.

## Voice System

### Audio Priority
1. **Bundled MP3s** — `AUDIO_FILES[voicePreset][affirmationId]` via `require()`. Currently bundled: Emma & James (~50 affirmations each).
2. **Custom recordings** — User-recorded via expo-speech-recognition on List screen. Stored as `affirmation.audioUri`.
3. **Device TTS fallback** — expo-speech with voice preset's pitch/rate config.

### Voice Presets
Six voices defined in `audioService.ts`: `emma`, `aria`, `luna`, `james`, `ryan`, `marcus`. Each maps to a Google Neural2 voice ID with fallback TTS settings. Only `emma` and `james` have `bundled: true`.

### Generating Voice Files
Scripts in `scripts/` for bulk MP3 generation via Google Cloud TTS API. See `scripts/VOICE_SETUP.md` for setup. Requires Google Cloud service account credentials.

## Affirmation Data Model

Source: `affirmationslist2.json` (400 affirmations at project root, loaded by `affirmationService.ts`).

```typescript
{ id: "anxiety_1", category: "Overcoming Anxiety", text: "I am calm and in control of my thoughts." }
```
Categories: Overcoming Anxiety, Building Confidence, Self-Love, Focus & Motivation, General Wellness. Custom affirmations add `isCustom: true` and optional `audioUri`.

## Design System

Colors in `constants/colors.ts`:
- Primary: `#CC9B7A` (warm tan) — tab active, buttons
- Secondary: `#1F1F1F` (dark charcoal) — text, end-session button
- Accent: `#D97757` (coral)
- Background: `#F5F5F5`, Surface: `#FFFFFF`

## Path Aliases

`@/*` maps to project root: `import { COLORS } from '@/constants/colors'`

## Babel/Metro Notes

- Babel: `react-native-reanimated/plugin` must be **last** in plugins array
- Metro: `.cjs` added to source extensions (Firebase ESM compatibility)
- Metro: Web platform excludes `react-native-maps` and `expo-speech-recognition`

## Environment Setup

Firebase credentials required in `.env` with `EXPO_PUBLIC_` prefix:
`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

## Gemini CLI (Large Codebase Analysis)

For analysis that exceeds context limits, use the Gemini CLI with `@` syntax to include files/directories:

```bash
gemini -p "@app/ @services/ Summarize the architecture"
gemini -p "@package.json @src/index.js Analyze dependencies"
gemini -p "@./ Give me an overview of this entire project"
gemini --all_files -p "Analyze the project structure"
```

Use `gemini -p` when analyzing entire codebases, comparing multiple large files, or verifying project-wide patterns. Paths in `@` syntax are relative to your current working directory.

## Development Principles

1. **Zustand only** — Don't introduce other state management (effector is in package.json but unused)
2. **Build end-to-end** — Complete features fully (UI + logic + data) before moving to next
3. **DRY** — Check existing stores/services/components before creating new ones
4. **Commit frequently** — Save working code every 30 minutes
