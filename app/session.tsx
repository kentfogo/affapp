import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import { useAffirmationAnalyticsStore } from '../store/affirmationAnalyticsStore';
import { audioService } from '../services/audioService';
import { locationService } from '../services/locationService';
import { storageService } from '../services/storageService';
import { useKeepAwake } from 'expo-keep-awake';
import { formatTime } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { logger } from '../utils/logger';

const HOLD_DURATION = 1500; // 1.5 seconds to pause

export default function SessionScreen() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [isPaused, setIsPaused] = useState(false);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [displayedAffirmation, setDisplayedAffirmation] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const lastDistanceCheck = useRef<number>(0);
  const currentAffirmationIndexRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    currentAffirmationIndexRef.current = currentAffirmationIndex;
  }, [currentAffirmationIndex]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

  useEffect(() => {
    if (currentSession?.isActive && !isPaused) {
      updateSessionState({ duration: elapsedTime });
    }
  }, [elapsedTime, currentSession?.isActive, isPaused]);

  useEffect(() => {
    if (currentSession?.isActive && sessionSettings?.intervalType === 'distance' && !isPaused) {
      updateSessionState({ distance: distance });
    }
  }, [distance, currentSession?.isActive, sessionSettings?.intervalType, isPaused]);

  const initializeSession = async () => {
    try {
      setCurrentAffirmationIndex(0);
      currentAffirmationIndexRef.current = 0;
      setElapsedTime(0);
      setDistance(0);
      setDisplayedAffirmation(null);

      await audioService.initialize();

      // Apply session settings to audio service
      if (sessionSettings) {
        audioService.setVolume(sessionSettings.volume);
        audioService.setVoicePreset(sessionSettings.voicePreset);
      }

      startSession();

      // Timer that respects pause state
      timeIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          setElapsedTime((prev) => prev + 1);
        }
      }, 1000);

      if (sessionSettings && sessionSettings.intervalType === 'distance') {
        const hasPermission = await locationService.checkPermission();
        if (hasPermission) {
          await locationService.startTracking((totalDistance) => {
            if (isPausedRef.current) return;
            const distanceInUnit = locationService.getDistance(
              sessionSettings.distanceUnit
            );
            setDistance(distanceInUnit);

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
          startTimeInterval();
        }
      } else {
        startTimeInterval();
      }

      // Play first affirmation
      setDisplayedAffirmation(selectedAffirmations[0]);
      triggerAffirmation();
    } catch (error: any) {
      logger.error('Failed to initialize session', error);
      Alert.alert('Error', error.message);
      router.back();
    }
  };

  const startTimeInterval = () => {
    if (sessionSettings?.timeInterval) {
      intervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          triggerAffirmation();
        }
      }, sessionSettings.timeInterval * 1000);
    }
  };

  const triggerAffirmation = async () => {
    if (selectedAffirmations.length === 0 || isPausedRef.current) return;

    const latestSession = useSessionStore.getState().currentSession;
    const currentIndex = currentAffirmationIndexRef.current;
    const affirmation = selectedAffirmations[currentIndex % selectedAffirmations.length];

    setDisplayedAffirmation(affirmation);

    const nextIndex = (currentIndex + 1) % selectedAffirmations.length;
    setCurrentAffirmationIndex(nextIndex);
    currentAffirmationIndexRef.current = nextIndex;

    await Haptics.selectionAsync();
    trackReplay(affirmation.id);

    const currentPlayed = latestSession?.affirmationsPlayed || [];
    const newAffirmationsPlayed = currentPlayed.includes(affirmation.id)
      ? currentPlayed
      : [...currentPlayed, affirmation.id];

    updateSessionState({
      currentAffirmationIndex: currentIndex,
      affirmationsPlayed: newAffirmationsPlayed,
    });

    try {
      await audioService.playAffirmation(affirmation, sessionSettings?.playChime || false);
    } catch (error) {
      logger.error('Failed to play affirmation', error);
    }
  };

  const handlePressIn = () => {
    if (isPaused) return; // If paused, just use regular press

    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      if (holdStartRef.current) {
        const elapsed = Date.now() - holdStartRef.current;
        const progress = Math.min(elapsed / HOLD_DURATION, 1);
        setHoldProgress(progress);

        if (progress >= 1) {
          // Held long enough - pause
          clearInterval(holdTimerRef.current!);
          holdTimerRef.current = null;
          holdStartRef.current = null;
          setHoldProgress(0);
          handlePause();
        }
      }
    }, 50);
  };

  const handlePressOut = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
  };

  const handlePause = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsPaused(true);
    isPausedRef.current = true;
    audioService.stop();
  };

  const handleEndSession = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cleanup();
    endSession();

    if (currentSession && user) {
      let isFirstSession = false;
      try {
        const existingSessions = await storageService.getSessionLogs(user.uid, 1);
        isFirstSession = existingSessions.length === 0;
      } catch (error) {
        logger.error('Error checking session count', error);
      }

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
      } catch (error) {
        logger.error('Error saving session log', error);
      }

      const params = {
        duration: currentSession?.duration.toString() || '0',
        distance: currentSession?.distance.toString() || '0',
        affirmationsCount: currentSession?.affirmationsPlayed.length.toString() || '0',
      };

      router.push({
        pathname: isFirstSession ? '/congratulations' : '/summary',
        params,
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
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    locationService.stopTracking();
    audioService.cleanup();
  };

  const formatPace = () => {
    if (distance === 0 || elapsedTime === 0) return "--'--\"";
    const paceSeconds = elapsedTime / distance;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  const currentAffirmation = displayedAffirmation || selectedAffirmations[0];
  const distanceUnit = sessionSettings?.distanceUnit === 'kilometers' ? 'km' : 'mi';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Stats Row */}
      <View style={[styles.topStats, { paddingTop: insets.top + 16 }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPace()}</Text>
          <Text style={styles.statLabel}>Pace</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentSession?.affirmationsPlayed.length || 0}</Text>
          <Text style={styles.statLabel}>Played</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
      </View>

      {/* Main Distance Display */}
      <View style={styles.mainDisplay}>
        <Text style={styles.distanceValue}>
          {distance.toFixed(2)}
        </Text>
        <Text style={styles.distanceUnit}>{distanceUnit}</Text>

        {isPaused && (
          <Text style={styles.pausedLabel}>PAUSED</Text>
        )}
      </View>

      {/* Current Affirmation */}
      {currentAffirmation && !isPaused && (
        <View style={styles.affirmationContainer}>
          <Text style={styles.affirmationText} numberOfLines={3}>
            "{currentAffirmation.text}"
          </Text>
        </View>
      )}

      {/* Spacer when paused */}
      {isPaused && <View style={styles.affirmationContainer} />}

      {/* Action Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {!isPaused ? (
          // Hold to Pause button
          <TouchableOpacity
            style={styles.actionButton}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            {holdProgress > 0 && (
              <View style={[styles.holdProgressBar, { width: `${holdProgress * 100}%` }]} />
            )}
            <Text style={styles.actionButtonText}>Hold to Pause</Text>
          </TouchableOpacity>
        ) : (
          // Press to End button
          <TouchableOpacity
            style={[styles.actionButton, styles.endButton]}
            onPress={handleEndSession}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Press to End</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  topStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    opacity: 0.6,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  mainDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  distanceValue: {
    fontSize: 120,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: -4,
  },
  distanceUnit: {
    fontSize: 24,
    color: COLORS.secondary,
    opacity: 0.6,
    marginTop: -8,
  },
  pausedLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 24,
    letterSpacing: 4,
  },
  affirmationContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  affirmationText: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 26,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  actionButton: {
    height: 64,
    backgroundColor: COLORS.secondary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  endButton: {
    backgroundColor: COLORS.accent,
  },
  holdProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
