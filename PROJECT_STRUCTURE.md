# AffApp - Project Structure Plan

## Proposed Folder Structure

```
AffApp/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── models/
│   │   │   │   └── user_model.dart
│   │   │   ├── screens/
│   │   │   │   ├── login_screen.dart
│   │   │   │   ├── signup_screen.dart
│   │   │   │   └── onboarding_screen.dart
│   │   │   ├── services/
│   │   │   │   └── auth_service.dart
│   │   │   └── widgets/
│   │   │
│   │   ├── onboarding/
│   │   │   ├── models/
│   │   │   │   └── onboarding_question.dart
│   │   │   ├── screens/
│   │   │   │   └── onboarding_flow_screen.dart
│   │   │   ├── services/
│   │   │   │   └── onboarding_service.dart
│   │   │   └── widgets/
│   │   │
│   │   ├── affirmations/
│   │   │   ├── models/
│   │   │   │   ├── affirmation_model.dart
│   │   │   │   └── affirmation_bank.dart
│   │   │   ├── screens/
│   │   │   │   ├── affirmation_selection_screen.dart
│   │   │   │   └── custom_affirmation_screen.dart
│   │   │   ├── services/
│   │   │   │   ├── affirmation_service.dart
│   │   │   │   └── negativity_screening_service.dart
│   │   │   └── widgets/
│   │   │
│   │   ├── sessions/
│   │   │   ├── models/
│   │   │   │   ├── session_model.dart
│   │   │   │   └── session_settings.dart
│   │   │   ├── screens/
│   │   │   │   ├── session_screen.dart
│   │   │   │   ├── session_summary_screen.dart
│   │   │   │   └── start_screen.dart
│   │   │   ├── services/
│   │   │   │   ├── session_service.dart
│   │   │   │   ├── audio_service.dart
│   │   │   │   └── interval_service.dart
│   │   │   └── widgets/
│   │   │       ├── current_affirmation_widget.dart
│   │   │       └── session_controls_widget.dart
│   │   │
│   │   └── profile/
│   │       ├── models/
│   │       │   └── user_preferences.dart
│   │       ├── screens/
│   │       │   └── profile_screen.dart
│   │       └── services/
│   │           └── profile_service.dart
│   │
│   ├── shared/
│   │   ├── constants/
│   │   │   └── app_constants.dart
│   │   ├── services/
│   │   │   ├── firebase_service.dart
│   │   │   └── storage_service.dart
│   │   ├── utils/
│   │   │   ├── validators.dart
│   │   │   └── helpers.dart
│   │   └── widgets/
│   │       ├── loading_widget.dart
│   │       └── error_widget.dart
│   │
│   └── core/
│       ├── routes/
│       │   └── app_router.dart
│       └── theme/
│           └── app_theme.dart
│
├── test/
│   └── (test files)
│
├── android/
├── ios/
├── web/
│
├── .env.example
├── .gitignore
├── pubspec.yaml
├── README.md
├── REQUIREMENTS.md
├── DEVELOPMENT_RULES.md
└── PROJECT_STRUCTURE.md
```

## Feature Breakdown

### 1. Authentication Feature
**Purpose**: User account creation and login
**Files**:
- `auth/models/user_model.dart` - User data model
- `auth/screens/login_screen.dart` - Login UI
- `auth/screens/signup_screen.dart` - Signup UI
- `auth/services/auth_service.dart` - Firebase Auth integration

### 2. Onboarding Feature
**Purpose**: Survey to determine affirmation preferences
**Files**:
- `onboarding/models/onboarding_question.dart` - Question model
- `onboarding/screens/onboarding_flow_screen.dart` - Multi-step onboarding
- `onboarding/services/onboarding_service.dart` - Onboarding logic

### 3. Affirmations Feature
**Purpose**: Manage affirmation selection and custom recordings
**Files**:
- `affirmations/models/affirmation_model.dart` - Affirmation data model
- `affirmations/models/affirmation_bank.dart` - 400-item bank
- `affirmations/screens/affirmation_selection_screen.dart` - Selection UI
- `affirmations/screens/custom_affirmation_screen.dart` - Recording UI
- `affirmations/services/affirmation_service.dart` - CRUD operations
- `affirmations/services/negativity_screening_service.dart` - Cloud Function integration

### 4. Sessions Feature
**Purpose**: Core session functionality with intervals and playback
**Files**:
- `sessions/models/session_model.dart` - Session data model
- `sessions/models/session_settings.dart` - Time/distance interval settings
- `sessions/screens/start_screen.dart` - Initial screen with "Start Movement" button
- `sessions/screens/session_screen.dart` - Active session UI
- `sessions/screens/session_summary_screen.dart` - Post-session summary
- `sessions/services/session_service.dart` - Session management
- `sessions/services/audio_service.dart` - Audio playback
- `sessions/services/interval_service.dart` - Interval tracking (time/distance)
- `sessions/widgets/current_affirmation_widget.dart` - Display current affirmation
- `sessions/widgets/session_controls_widget.dart` - Long-press stop control

### 5. Profile Feature
**Purpose**: User preferences and settings
**Files**:
- `profile/models/user_preferences.dart` - Preferences model
- `profile/screens/profile_screen.dart` - Profile UI
- `profile/services/profile_service.dart` - Preferences management

## Implementation Order (Following Rule 7)

1. **Authentication** (Complete end-to-end)
   - Signup
   - Login
   - Firebase Auth integration
   - User model

2. **Onboarding** (Complete end-to-end)
   - Survey/questions
   - Preference collection
   - Data persistence

3. **Affirmations** (Complete end-to-end)
   - Affirmation bank
   - Selection UI
   - Custom recording
   - Negativity screening
   - Storage

4. **Sessions** (Complete end-to-end)
   - Start screen
   - Session screen
   - Interval tracking
   - Audio playback
   - Stop functionality
   - Summary screen

5. **Profile** (Complete end-to-end)
   - Preferences management
   - Settings UI

## Firebase Structure

### Firestore Collections
```
users/
  {userId}/
    profile/
    preferences/
    selectedAffirmations/
    sessions/

affirmations/
  {affirmationId}/
    text/
    category/
    tags/

sessions/
  {sessionId}/
    userId/
    startTime/
    endTime/
    affirmationsPlayed/
    intervals/
```

### Cloud Storage
```
users/
  {userId}/
    customAffirmations/
      {affirmationId}.mp3
```

### Cloud Functions
- `screenNegativity` - Validates custom affirmations for negative content

