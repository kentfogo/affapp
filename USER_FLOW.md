# User Flow Chart

This document outlines the complete user journey through the Mental Victory Practice app.

```mermaid
flowchart TD
    Start([App Launch]) --> CheckAuth{User Authenticated?}
    
    CheckAuth -->|No| Login[Login Screen]
    Login --> AuthSuccess{Authentication Successful?}
    AuthSuccess -->|Yes| CheckOnboarding
    AuthSuccess -->|No| Login
    
    CheckAuth -->|Yes| CheckOnboarding{Onboarding Complete?}
    
    CheckOnboarding -->|No| Onboarding[Onboarding Flow]
    Onboarding --> Step1[Step 1: Primary Goal Selection]
    Step1 --> Step2[Step 2: Category Preferences]
    Step2 --> Step3[Step 3: Voice Preference]
    Step3 --> Step4[Step 4: Distance Unit Selection]
    Step4 --> OnboardingComplete[Onboarding Complete]
    OnboardingComplete --> Home
    
    CheckOnboarding -->|Yes| CheckQuote{First Time Opening App?}
    CheckQuote -->|Yes| QuoteFlash[Quote Flash Screen<br/>with Red Panda]
    QuoteFlash --> Home
    CheckQuote -->|No| Home[Home Screen<br/>with Red Panda]
    
    Home --> SelectAffirmations[Select Affirmations]
    SelectAffirmations --> SwipeCards[Swipe Through Affirmation Cards]
    SwipeCards --> Select5to10{5-10 Affirmations Selected?}
    Select5to10 -->|No| SwipeCards
    Select5to10 -->|Yes| SaveSelections[Save Selections]
    SaveSelections --> Home
    
    Home --> StartSession{Start Session?}
    StartSession -->|Yes| Session[Session Screen<br/>Today's Journey<br/>with Red Panda]
    
    Session --> DisplayAffirmation[Display Current Affirmation<br/>with Circular Timer]
    DisplayAffirmation --> PlayAudio[Play Affirmation Audio]
    PlayAudio --> TrackTime[Track Time/Distance]
    TrackTime --> CheckInterval{Interval Reached?}
    
    CheckInterval -->|No| TrackTime
    CheckInterval -->|Yes| NextAffirmation[Rotate to Next Affirmation]
    NextAffirmation --> PlayAudio
    
    Session --> StopSession{Long Press Stop?}
    StopSession -->|Yes| SaveSession[Save Session Log]
    SaveSession --> CheckFirst{First Session Ever?}
    
    CheckFirst -->|Yes| FirstCongrats[First Session Congratulations<br/>with Medal Icon<br/>and Red Panda]
    FirstCongrats --> ShowStats1[Display: 1st Session Badge]
    ShowStats1 --> Continue1[Continue Button]
    Continue1 --> YouTab
    
    CheckFirst -->|No| RegularCongrats[Regular Session Congratulations<br/>with Red Panda]
    RegularCongrats --> ShowStats2[Display: Total Sessions<br/>Current Streak<br/>Session Stats]
    ShowStats2 --> Continue2[Continue Button]
    Continue2 --> Home
    
    Home --> YouTab[You Tab]
    YouTab --> ProgressTab[Progress Tab]
    ProgressTab --> ViewStats[View: Total Sessions<br/>Current Streak<br/>Longest Streak<br/>Calendar View]
    
    YouTab --> ActivitiesTab[Activities Tab]
    ActivitiesTab --> ViewSessions[View Recent Sessions<br/>with Proper Dates:<br/>Today/Yesterday/Actual Date]
    
    Home --> AffirmationsTab[Affirmations Tab]
    AffirmationsTab --> SelectAffirmations
    
    Home --> SettingsTab[Settings Tab]
    SettingsTab --> ConfigureSettings[Configure Session Settings:<br/>Time/Distance Intervals]
    ConfigureSettings --> Home
    
    Home --> LibraryTab[Library Tab]
    LibraryTab --> BrowseAffirmations[Browse Affirmation Library]
    
    style Start fill:#CC9B7A
    style FirstCongrats fill:#D97757
    style RegularCongrats fill:#D97757
    style Session fill:#CC9B7A
    style Home fill:#F5F5F5
```

## Key User Paths

### First-Time User Path
1. App Launch → Login → Onboarding (4 steps) → Quote Flash → Home
2. Select 5-10 Affirmations → Start Session → Complete Session → First Congratulations → You Tab

### Returning User Path
1. App Launch → Home (no quote flash)
2. Start Session → Complete Session → Regular Congratulations → Home

### Session Flow
1. Start Session → Display Affirmation with Circular Timer
2. Play Affirmation Audio → Track Time/Distance
3. When Interval Reached → Rotate to Next Affirmation → Repeat
4. Long Press Stop → Save Session → Show Appropriate Congratulations Screen

## Screen Components

### Session Screen Features
- Red Panda image at top
- Current affirmation display
- Circular progress timer around affirmation (shows time until next affirmation)
- Real-time stats: Time, Distance (if enabled), Affirmations count
- Long-press stop button

### Congratulations Screens
- **First Session**: Medal icon, "1st Session" badge, special messaging, Red Panda
- **Regular Sessions**: Total sessions count, current streak, session stats, Red Panda

### Navigation Tabs
- **Home**: Main screen with session controls
- **Affirmations**: Select and manage affirmations
- **You**: Progress and Activities sub-tabs
- **Settings**: Configure session preferences
- **Library**: Browse affirmation library (if implemented)



