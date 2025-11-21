import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import { useAffirmationAnalyticsStore } from '../store/affirmationAnalyticsStore';
import { audioService } from '../services/audioService';
import { locationService } from '../services/locationService';
import { storageService } from '../services/storageService';
import { useKeepAwake } from 'expo-keep-awake';
import LongPressButton from '../components/LongPressButton';
import { formatTime } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { logger } from '../utils/logger';

export default function SessionScreen() {
  useKeepAwake();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    selectedAffirmations,
    sessionSettings,
    currentSession,
    startSession,
    endSession,
    updateSessionState,
  } = useSessionStore();
  const { trackReplay } = useAffirmationAnalyticsStore();

  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [displayedAffirmation, setDisplayedAffirmation] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [timeSinceLastAffirmation, setTimeSinceLastAffirmation] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastIntervalTrigger = useRef<number>(0);
  const lastDistanceCheck = useRef<number>(0);
  const lastAffirmationTime = useRef<number>(Date.now());
  const currentAffirmationIndexRef = useRef<number>(0);

  // Calculate responsive affirmation card width
  // Circle: radius 130px, diameter 260px, stroke 8px (4px on each side)
  // Inner circle diameter: 260 - 8 = 252px
  // Card max width: 252 - 60 (30px padding on each side) = 192px for safety
  const screenWidth = Dimensions.get('window').width;
  const circleInnerDiameter = 252; // 260 - 8 (stroke width)
  const maxCardWidth = circleInnerDiameter - 60; // 30px padding on each side for safety
  const responsiveCardWidth = Math.min(screenWidth - 80, maxCardWidth);

  // Sync ref with state to ensure interval callbacks see latest value
  useEffect(() => {
    currentAffirmationIndexRef.current = currentAffirmationIndex;
  }, [currentAffirmationIndex]);

  // Debug session initialization
  useEffect(() => {
    console.log('=== SESSION MOUNT DEBUG ===');
    console.log('Selected affirmations:', selectedAffirmations.length);
    console.log('Affirmation IDs:', selectedAffirmations.map(a => a.id));
    console.log('Session settings:', sessionSettings);
    console.log('==========================');

    return () => {
      console.log('=== SESSION UNMOUNT ===');
    };
  }, []);

  // Monitor index changes
  useEffect(() => {
    console.log('Index changed (state):', currentAffirmationIndex);
    console.log('Index changed (ref):', currentAffirmationIndexRef.current);
  }, [currentAffirmationIndex]);

  useEffect(() => {
    if (!sessionSettings || selectedAffirmations.length === 0) {
      Alert.alert('Error', 'Please configure your session settings');
      router.back();
      return;
    }

    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  // Sync elapsedTime to store (FIX: moved out of setState callback)
  useEffect(() => {
    if (currentSession?.isActive) {
      updateSessionState({ duration: elapsedTime });
    }
  }, [elapsedTime, currentSession?.isActive, updateSessionState]);

  // Sync distance to store (FIX: moved out of location callback)
  useEffect(() => {
    if (currentSession?.isActive && sessionSettings?.intervalType === 'distance') {
      updateSessionState({ distance: distance });
    }
  }, [distance, currentSession?.isActive, sessionSettings?.intervalType, updateSessionState]);

  const initializeSession = async () => {
    try {
      logger.info('Initializing session', { 
        affirmationsCount: selectedAffirmations.length,
        intervalType: sessionSettings?.intervalType 
      });
      await audioService.initialize();
      startSession();

      // Start time tracking (FIX: removed updateSessionState from callback)
      timeIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Start timer progress tracking
      lastAffirmationTime.current = Date.now();
      timerUpdateRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLast = Math.floor((now - lastAffirmationTime.current) / 1000);
        setTimeSinceLastAffirmation(timeSinceLast);
      }, 100);

      // Start location tracking if distance intervals are enabled
      if (sessionSettings && sessionSettings.intervalType === 'distance') {
        const hasPermission = await locationService.checkPermission();
        if (hasPermission) {
          await locationService.startTracking((totalDistance) => {
            const distanceInUnit = locationService.getDistance(
              sessionSettings.distanceUnit
            );
            // FIX: Only update local state here, store sync happens in useEffect
            setDistance(distanceInUnit);

            // Check if distance interval has been reached
            if (
              sessionSettings.distanceInterval &&
              distanceInUnit - lastDistanceCheck.current >=
                sessionSettings.distanceInterval
            ) {
              lastDistanceCheck.current = distanceInUnit;
              triggerAffirmation();
            }
          });
        } else {
          Alert.alert(
            'Location Permission',
            'Location permission is required for distance intervals. Falling back to time intervals.',
            [{ text: 'OK' }]
          );
          // Fallback to time intervals
          startTimeInterval();
        }
      } else {
        // Start time-based intervals
        startTimeInterval();
      }

      // Play first affirmation immediately (FIX: start at index 0)
      setCurrentAffirmationIndex(0);
      currentAffirmationIndexRef.current = 0;
      setDisplayedAffirmation(selectedAffirmations[0]);
      triggerAffirmation();
      logger.success('Session initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize session', error);
      Alert.alert('Error', error.message);
      router.back();
    }
  };

  const startTimeInterval = () => {
    if (sessionSettings?.timeInterval) {
      intervalRef.current = setInterval(() => {
        triggerAffirmation();
      }, sessionSettings.timeInterval * 1000);
    }
  };

  const triggerAffirmation = async () => {
    if (selectedAffirmations.length === 0) return;

    // Use REF for synchronous access, not state
    const currentIndex = currentAffirmationIndexRef.current;
    const affirmation = selectedAffirmations[currentIndex % selectedAffirmations.length];

    // Set displayed affirmation immediately so UI matches audio
    setDisplayedAffirmation(affirmation);

    console.log('=== AFFIRMATION TRIGGER ===');
    console.log(`Playing: #${currentIndex + 1}/${selectedAffirmations.length}`);
    console.log(`Text: "${affirmation.text}"`);
    console.log(`ID: ${affirmation.id}`);
    console.log('==========================');

    // Calculate next index
    const nextIndex = (currentIndex + 1) % selectedAffirmations.length;

    // Update BOTH state and ref immediately
    setCurrentAffirmationIndex(nextIndex);
    currentAffirmationIndexRef.current = nextIndex;

    // Reset timer
    lastAffirmationTime.current = Date.now();
    setTimeSinceLastAffirmation(0);

    await Haptics.selectionAsync();

    // Track replay analytics
    trackReplay(affirmation.id);

    // Update session state with CURRENT index (before increment)
    updateSessionState({
      currentAffirmationIndex: currentIndex, // Use current, not next
      affirmationsPlayed: [
        ...(currentSession?.affirmationsPlayed || []),
        affirmation.id,
      ],
    });

    try {
      console.log('🎵 ABOUT TO PLAY:', {
        displayedText: displayedAffirmation?.text,
        playingId: affirmation.id,
        playingText: affirmation.text,
        match: displayedAffirmation?.id === affirmation.id,
      });
      await audioService.playAffirmation(affirmation);
      logger.success('Affirmation played', { id: affirmation.id, index: currentIndex });
      console.log('✅ AUDIO COMPLETE:', affirmation.id);
    } catch (error) {
      logger.error('Failed to play affirmation', error);
    }
  };

  const handleStop = async () => {
    cleanup();
    endSession();

    if (currentSession && user) {
      // Check if this is the first session before saving
      let isFirstSession = false;
      try {
        const existingSessions = await storageService.getSessionLogs(user.uid, 1);
        isFirstSession = existingSessions.length === 0;
      } catch (error) {
        logger.error('Error checking session count', error);
      }

      // Save session log
      const sessionLog = {
        id: `session_${Date.now()}`,
        userId: user.uid,
        startTime: currentSession.startTime,
        endTime: Date.now(),
        duration: currentSession.duration,
        distance: currentSession.distance,
        affirmationsPlayed: currentSession.affirmationsPlayed,
        createdAt: Date.now(),
      };

      try {
        await storageService.saveSessionLog(sessionLog);
        logger.success('Session log saved', { sessionId: sessionLog.id });
      } catch (error) {
        logger.error('Error saving session log', error);
      }

      // Route to appropriate screen based on whether it's first session
      if (isFirstSession) {
        router.push({
          pathname: '/congratulations',
          params: {
            duration: currentSession?.duration.toString() || '0',
            distance: currentSession?.distance.toString() || '0',
            affirmationsCount: currentSession?.affirmationsPlayed.length.toString() || '0',
          },
        });
      } else {
        router.push({
          pathname: '/summary',
          params: {
            duration: currentSession?.duration.toString() || '0',
            distance: currentSession?.distance.toString() || '0',
            affirmationsCount: currentSession?.affirmationsPlayed.length.toString() || '0',
          },
        });
      }
    } else {
      // Fallback if no user or session
      router.push({
        pathname: '/summary',
        params: {
          duration: currentSession?.duration.toString() || '0',
          distance: currentSession?.distance.toString() || '0',
          affirmationsCount: currentSession?.affirmationsPlayed.length.toString() || '0',
        },
      });
    }
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    if (timerUpdateRef.current) {
      clearInterval(timerUpdateRef.current);
      timerUpdateRef.current = null;
    }
    locationService.stopTracking();
    audioService.cleanup();
  };

  const currentAffirmation = displayedAffirmation || selectedAffirmations[0];

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Red Panda Image */}
          <Image
            source={require('../assets/red-panda.png')}
            style={styles.redPandaImage}
            resizeMode="contain"
          />
          
          <View style={styles.header}>
            <Text style={styles.title}>Today's Journey</Text>
            <Text style={styles.subtitle}>Keep moving, keep growing</Text>
          </View>

          <View style={styles.affirmationCardContainer}>
            {/* Circular Timer */}
            {sessionSettings?.timeInterval && (
              <Svg width={280} height={280} style={styles.timerSvg}>
                {/* Background circle */}
                <Circle
                  cx={140}
                  cy={140}
                  r={130}
                  stroke={COLORS.border}
                  strokeWidth={8}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={140}
                  cy={140}
                  r={130}
                  stroke={COLORS.primary}
                  strokeWidth={8}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 130}
                  strokeDashoffset={
                    2 * Math.PI * 130 * (1 - Math.min(timeSinceLastAffirmation / sessionSettings.timeInterval, 1))
                  }
                  strokeLinecap="round"
                  transform={`rotate(-90 140 140)`}
                />
              </Svg>
            )}
            <View style={[styles.affirmationCard, { width: Math.min(responsiveCardWidth, 192) }]}>
              <View style={styles.affirmationContent}>
                <Text style={styles.affirmationText}>
                  "{currentAffirmation?.text || 'Loading...'}"
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            {sessionSettings?.intervalType === 'distance' && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {distance.toFixed(2)}{' '}
                  {sessionSettings.distanceUnit === 'miles' ? 'mi' : 'km'}
                </Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentSession?.affirmationsPlayed.length || 0}
              </Text>
              <Text style={styles.statLabel}>Affirmations</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <LongPressButton
          onLongPress={handleStop}
          title="Press and Hold to Stop"
          holdDuration={1200}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height - 150, // Account for footer
    alignItems: 'center',
  },
  redPandaImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  affirmationCardContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  timerSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  affirmationCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    maxWidth: 192, // Inner circle diameter (252) - 60px total padding (30px each side) to prevent overlap
    minHeight: 180,
    justifyContent: 'center',
    zIndex: 1,
    alignSelf: 'center',
  },
  affirmationContent: {
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});