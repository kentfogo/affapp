# Implementation Plan - Mental Victory Practice

## Context Clarifications (Defaults Applied)

- **App Name**: Mental Victory Practice (working title)
- **Distance Units**: Both miles and kilometers (user-selectable)
- **Onboarding Questions**: Primary goal, preferred categories, voice preference, unit preference
- **TTS Voice**: System default with locale support (user-selectable in settings)
- **Accessibility**: WCAG AA contrast, 16pt minimum font, VoiceOver/TalkBack support
- **Persistence**: AsyncStorage for preferences/affirmations, SQLite for session logs
- **Expo SDK**: 52 (latest stable)

## Three Implementation Variations

### Variation 1: Minimal & Pragmatic (Recommended)
**Philosophy**: Ship fast, optimize later. Focus on core reliability.

**Stack**:
- Expo Router (file-based routing)
- Zustand (lightweight state)
- AsyncStorage + SQLite (hybrid persistence)
- expo-av + expo-speech (audio)
- expo-location (GPS)
- Firebase Auth (email + anonymous)

**Key Decisions**:
- Single session store (Zustand)
- Debounced interval triggers (500ms)
- Pre-synthesize TTS on selection
- Simple distance smoothing (moving average)
- Foreground-only with keep-awake

**Pros**: Fast to implement, easy to debug, minimal dependencies
**Cons**: Less scalable, basic state management

---

### Variation 2: Robust & Scalable
**Philosophy**: Build for growth. Enterprise-ready patterns.

**Stack**:
- Expo Router
- Redux Toolkit + RTK Query (state + async)
- SQLite only (unified persistence)
- expo-av + expo-speech
- expo-location with background service hooks
- Firebase Auth + Firestore sync

**Key Decisions**:
- Normalized state (Redux)
- Service layer abstraction
- Background sync preparation
- Advanced distance algorithms (Kalman filter)
- Comprehensive error boundaries

**Pros**: Scalable, testable, production-ready
**Cons**: More boilerplate, steeper learning curve

---

### Variation 3: Flutter Alternative (Reference)
**Philosophy**: Native performance, single codebase, mature ecosystem.

**Stack**:
- Flutter 3.x
- Riverpod (state management)
- Hive (local storage) + SQLite
- just_audio (audio playback)
- flutter_tts (TTS)
- geolocator (location)
- Firebase Auth + Firestore

**Key Decisions**:
- Feature-first architecture
- Provider-based dependency injection
- Isolates for heavy computation
- Platform channels for native features

**Pros**: Native performance, single codebase, mature tooling
**Cons**: Different language, larger bundle size

---

## Analysis & Recommendation

### Best Choice: Variation 1 (Minimal & Pragmatic)

**Rationale**:
1. **Stability**: Expo SDK 52 is stable; Zustand is battle-tested
2. **Dev Speed**: Minimal boilerplate, fast iteration
3. **Permission Complexity**: Expo handles permissions well; graceful fallbacks
4. **Maintainability**: Simple architecture, easy to extend
5. **MVP Fit**: Meets all requirements without over-engineering

**Rubric Alignment**:
- ✅ Runs in Expo Go: Yes (Expo Router + standard APIs)
- ✅ Complete flow: Yes (file-based routing ensures navigation)
- ✅ Audio reliability: Yes (expo-av + expo-speech are mature)
- ✅ Distance intervals: Yes (expo-location with fallback)
- ✅ Clear UX: Yes (minimal, focused screens)

**Trade-offs Accepted**:
- SQLite for logs only (not all data) - acceptable for MVP
- Basic distance smoothing - sufficient for foreground use
- No background execution - aligns with MVP constraints

---

## Implementation Strategy

### Phase 1: Foundation (Auth + Onboarding)
1. Expo project setup
2. Firebase Auth integration
3. Onboarding flow
4. AsyncStorage persistence

### Phase 2: Core Features (Affirmations + Sessions)
1. Affirmation bank loading
2. Selection UI
3. Session screen with intervals
4. Audio playback (TTS + recorded)

### Phase 3: Polish (Location + Summary)
1. Distance tracking
2. Session summary
3. Positive reinforcement
4. Settings screen

### Phase 4: Testing & Refinement
1. Permission flows
2. Edge cases
3. Performance optimization
4. Accessibility audit

---

## Next Steps

Proceeding with **Variation 1** implementation. Generating project structure and core files.

