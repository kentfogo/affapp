import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import { audioService } from '../services/audioService';
import { locationService } from '../services/locationService';
import { storageService } from '../services/storageService';
import { useKeepAwake } from 'expo-keep-awake';
import LongPressButton from '../components/LongPressButton';
import { formatTime } from '../utils/formatTime';

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

  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastIntervalTrigger = useRef<number>(0);
  const lastDistanceCheck = useRef<number>(0);

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

  const initializeSession = async () => {
    try {
      await audioService.initialize();
      startSession();

      // Start time tracking
      timeIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          updateSessionState({ duration: newTime });
          return newTime;
        });
      }, 1000);

      // Start location tracking if distance intervals are enabled
      if (sessionSettings.intervalType === 'distance') {
        const hasPermission = await locationService.checkPermission();
        if (hasPermission) {
          await locationService.startTracking((totalDistance) => {
            const distanceInUnit = locationService.getDistance(
              sessionSettings.distanceUnit
            );
            setDistance(distanceInUnit);
            updateSessionState({ distance: distanceInUnit });

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

      // Play first affirmation immediately
      triggerAffirmation();
    } catch (error: any) {
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

    const nextIndex =
      (currentAffirmationIndex + 1) % selectedAffirmations.length;
    setCurrentAffirmationIndex(nextIndex);
    const affirmation = selectedAffirmations[nextIndex];

    updateSessionState({
      currentAffirmationIndex: nextIndex,
      affirmationsPlayed: [
        ...(currentSession?.affirmationsPlayed || []),
        affirmation.id,
      ],
    });

    try {
      await audioService.playAffirmation(affirmation);
    } catch (error) {
      console.error('Error playing affirmation:', error);
    }
  };

  const handleStop = async () => {
    cleanup();
    endSession();

    if (currentSession && user) {
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
      } catch (error) {
        console.error('Error saving session log:', error);
      }
    }

    router.push({
      pathname: '/summary',
      params: {
        duration: currentSession?.duration.toString() || '0',
        distance: currentSession?.distance.toString() || '0',
        affirmationsCount: currentSession?.affirmationsPlayed.length.toString() || '0',
      },
    });
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
    locationService.stopTracking();
    audioService.cleanup();
  };

  const currentAffirmation =
    selectedAffirmations[currentAffirmationIndex] ||
    selectedAffirmations[0];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today's Journey</Text>
          <Text style={styles.subtitle}>Keep moving, keep growing</Text>
        </View>

        <View style={styles.affirmationCard}>
          <View style={styles.affirmationContent}>
            <Text style={styles.affirmationText}>
              "{currentAffirmation?.text || 'Loading...'}"
            </Text>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  affirmationCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    minHeight: 200,
    justifyContent: 'center',
  },
  affirmationContent: {
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1A1A1A',
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
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

