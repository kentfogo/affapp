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
npm run web        # Run in web browser
```

## Architecture

### Directory Structure

- **`app/`** - Expo Router screens (file-based routing)
  - `(auth)/` - Login screens
  - `(tabs)/` - Main tab navigation (home, affirmations, library, settings, you/)
  - `session.tsx` - Active movement session with affirmation playback
  - `onboarding.tsx` - Multi-step user preferences flow
  - `summary.tsx` - Post-session results

- **`store/`** - Zustand state stores
  - `sessionStore.ts` - Session state, selected affirmations, interval settings
  - `authStore.ts` - User authentication
  - `moodStore.ts` - Pre/post-workout mood tracking
  - `affirmationAnalyticsStore.ts` - Interaction metrics (accepts, rejects, favorites)
  - `offlineStore.ts` - Offline mode detection

- **`services/`** - Business logic
  - `firebase.ts` - Firebase initialization
  - `affirmationService.ts` - Affirmation bank operations
  - `audioService.ts` - Text-to-speech playback
  - `locationService.ts` - GPS tracking for distance-based intervals
  - `cacheService.ts` - Offline data caching

- **`components/`** - Reusable UI components
- **`constants/colors.ts`** - Centralized color palette
- **`data/affirmationslist2.json`** - 400-item affirmation bank

### Key User Flows

**New User:** Login → Onboarding → Affirmation Selection (swipeable cards) → Session → Summary

**Returning User:** Home → Start Session → Session → Summary

### State Management Pattern

Zustand stores with AsyncStorage persistence. Each store exports hooks for component use.

## Design System

Colors defined in `constants/colors.ts`:
- Primary: `#CC9B7A` (warm tan)
- Secondary: `#1F1F1F` (dark charcoal)
- Accent: `#D97757` (coral)
- Background: `#F5F5F5`

## Development Principles (from DEVELOPMENT_RULES.md)

1. **DRY** - Check for existing functionality before implementing new code
2. **Single Responsibility** - One function, one job
3. **Build End-to-End** - Complete features fully (UI, logic, data) before moving to next
4. **Organize by Feature** - Keep related code together
5. **Commit Frequently** - Save working code every 30 minutes; commit after each working milestone

## Environment Setup

Firebase credentials required in `.env`:
- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- EXPO_PUBLIC_FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
- EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- EXPO_PUBLIC_FIREBASE_APP_ID

## Key Files

- `app/_layout.tsx` - Root layout with providers
- `app/(tabs)/_layout.tsx` - Tab navigation configuration
- `app/session.tsx` - Core session experience (affirmation playback loop)
- `store/sessionStore.ts` - Central session state
- `services/firebase.ts` - Firebase initialization

## AI Coding Guidelines

### Security Requirements

- **Authentication**: Use Firebase Auth; validate permissions server-side (Firestore rules), not client-side
- **Data Protection**: Validate/sanitize all user inputs; use Firestore security rules for access control
- **Secrets**: All API keys in `.env` with `EXPO_PUBLIC_` prefix; never commit secrets
- **Error Messages**: Don't expose system details in user-facing errors

### Technical Debt Prevention

- **Components**: Create reusable components; no code duplication; single responsibility
- **State**: Zustand only - don't introduce other state management solutions
- **Database**: Plan Firestore schema before building; use proper document/collection structure
- **Performance**: Optimize images; implement caching for API calls; monitor bundle size

### Before Writing Code

- Clearly define the problem being solved
- Know what a good solution looks like
- Understand the business logic first
- Read and understand existing code before modifying
- Check for existing utilities/components before creating new ones

### During Development

- Read and understand AI-generated code before using it
- Test edge cases AI might not consider
- Document architectural decisions and the "why" behind them
- Maintain ability to explain how features work

### Code Quality Checks

- Can you explain the data flow to someone else?
- Can you debug issues without AI assistance?
- Is the code maintainable by future developers?
- Are there any N+1 query problems or performance issues?

### Production Readiness

- Environment variables configured for production
- Error handling and logging implemented
- Graceful degradation when services unavailable
- Static assets optimized and cached
