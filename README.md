# AffApp

An affirmation app built with Flutter and Firebase that helps users hear personalized affirmations at intervals during movement sessions.

## Project Status

🚧 **Planning Phase** - Requirements and rules have been defined. Ready to begin implementation.

## Quick Links

- [Requirements & Success Criteria](./REQUIREMENTS.md)
- [Development Rules & Principles](./DEVELOPMENT_RULES.md)
- [Project Structure Plan](./PROJECT_STRUCTURE.md)

## Tech Stack

- **Frontend**: Flutter
- **Backend**: Firebase
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Functions

## Key Features

- User authentication and onboarding
- 400-item affirmation bank
- Custom affirmation recording
- Negativity screening for custom affirmations
- Time and distance interval support
- Audio playback during sessions
- Session tracking and summaries
- Positive reinforcement

## Getting Started

### Prerequisites

- Flutter SDK (latest stable version)
- Firebase account and project
- Android Studio / Xcode (for mobile development)
- VS Code or Android Studio (for development)

### Setup Instructions

_To be added during implementation phase_

## Development Workflow

1. **Complete one feature end-to-end** before moving to the next
2. **Commit after each working milestone**
3. **Save working code every 30 minutes**
4. **Organize by user action** - keep related functionality together

## Project Rules

See [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) for complete development principles and guidelines.

### Key Principles

1. **DRY** - Don't Repeat Yourself
2. **Security-First** - Secure defaults, validate input, sanitize data
3. **Single Responsibility** - One function, one job
4. **Stick with Framework** - Use Flutter/Firebase ecosystem
5. **Clarity > Cleverness** - Readable, maintainable code
6. **Build End-to-End** - Complete features fully before moving on
7. **Organize by Feature** - Feature-based folder structure

## User Flows

### New Users
1. Open app → Complete survey → Choose affirmations → Record or use app voice → Select 5-10 affirmations → Start Movement → Hear affirmations → End session → Positive reinforcement

### Active Users
1. Open app → Start Movement → Hear affirmations → End session → Positive reinforcement

## Next Steps

1. Initialize Flutter project
2. Set up Firebase project
3. Configure Firebase services
4. Implement authentication feature (end-to-end)
5. Implement onboarding feature (end-to-end)
6. Continue with remaining features...

## Questions to Ask Before Coding

- How will users know this solved their problem?
- What does "working well" look like in real usage?
- What specific outcomes define "done"?

---

**Note**: This project follows a feature-complete development approach. Each feature must be fully implemented (UI, logic, data) before moving to the next feature.

