import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import { useAffirmationAnalyticsStore } from '../store/affirmationAnalyticsStore';
import { useMoodStore, MoodRating } from '../store/moodStore';
import { audioService } from '../services/audioService';
import { locationService } from '../services/locationService';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { useKeepAwake } from 'expo-keep-awake';
import MoodCheckModal from './MoodCheckModal';
import { COLORS } from '../constants/colors';
import { logger } from '../utils/logger';

export default function SessionScreen() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ moodEntryId?: string }>();
  const { user } = useAuthStore();
  const {
    selectedAffirmations,
    sessionSettings,
    currentSession,
    currentMoodEntryId,
    setMoodEntryId,
    startSession,
    endSession,
    updateSessionState,
    addLocationToRoute,
    routePath,
    currentSpeed,
    updateSpeed,
    isSessionPaused,
    pauseSession,
    resumeSession,
    resetMapState,
  } = useSessionStore();
  const { trackReplay } = useAffirmationAnalyticsStore();
  const { savePostWorkoutMood, getMoodImprovement } = useMoodStore();

  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [displayedAffirmation, setDisplayedAffirmation] = useState<any>(null);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showPostMoodModal, setShowPostMoodModal] = useState(false);
  const [sessionEndData, setSessionEndData] = useState<{
    duration: number;
    distance: number;
    affirmationsCount: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDistanceCheck = useRef<number>(0);
  const lastAffirmationTime = useRef<number>(Date.now());
  const currentAffirmationIndexRef = useRef<number>(0);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const isSessionPausedRef = useRef<boolean>(false);

  // Sync refs with state to ensure interval callbacks see latest values
  useEffect(() => {
    currentAffirmationIndexRef.current = currentAffirmationIndex;
  }, [currentAffirmationIndex]);

  useEffect(() => {
    isSessionPausedRef.current = isSessionPaused;
  }, [isSessionPaused]);

  useEffect(() => {
    if (!sessionSettings || selectedAffirmations.length === 0) {
      Alert.alert('Error', 'Please configure your session settings');
      router.back();
      return;
    }

    // Store mood entry ID if passed from home screen
    if (params.moodEntryId) {
      setMoodEntryId(params.moodEntryId);
    }

    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  // Sync elapsedTime to store
  useEffect(() => {
    if (currentSession?.isActive && !isSessionPaused) {
      updateSessionState({ duration: elapsedTime });
    }
  }, [elapsedTime, currentSession?.isActive, isSessionPaused, updateSessionState]);

  // Sync distance to store
  useEffect(() => {
    if (currentSession?.isActive && sessionSettings?.intervalType === 'distance') {
      updateSessionState({ distance: distance });
    }
  }, [distance, currentSession?.isActive, sessionSettings?.intervalType, updateSessionState]);

  // Update lock screen notification
  useEffect(() => {
    if (currentSession?.isActive && displayedAffirmation) {
      const timerString = formatTime(elapsedTime);
      notificationService.updateNotification(
        timerString,
        displayedAffirmation.text,
        isSessionPaused
      );
    }
  }, [elapsedTime, displayedAffirmation, isSessionPaused, currentSession?.isActive]);

  const initializeSession = async () => {
    try {
      logger.info('Initializing session (no map)', {
        affirmationsCount: selectedAffirmations.length,
        intervalType: sessionSettings?.intervalType
      });

      // Reset all state
      setCurrentAffirmationIndex(0);
      currentAffirmationIndexRef.current = 0;
      setElapsedTime(0);
      setDistance(0);
      setDisplayedAffirmation(null);
      resetMapState();

      await audioService.initialize();

      // Set volume from settings
      if (sessionSettings?.volume !== undefined) {
        audioService.setVolume(sessionSettings.volume);
      }

      // Set voice preset from settings
      if (sessionSettings?.voicePreset) {
        audioService.setVoicePreset(sessionSettings.voicePreset);
      }

      // Create shuffled indices if random mode
      if (sessionSettings?.repetitionMode === 'random') {
        const indices = selectedAffirmations.map((_, i) => i);
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setShuffledIndices(indices);
      } else {
        setShuffledIndices(selectedAffirmations.map((_, i) => i));
      }

      startSession();

      // Request location permission for distance tracking
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        startLocationTracking();
      }

      // Start time tracking
      timeIntervalRef.current = setInterval(() => {
        if (!isSessionPausedRef.current) {
          setElapsedTime((prev) => prev + 1);
        }
      }, 1000);

      // Start time-based intervals if configured
      if (sessionSettings && sessionSettings.intervalType === 'time') {
        startTimeInterval();
      }

      // Play first affirmation immediately
      setCurrentAffirmationIndex(0);
      currentAffirmationIndexRef.current = 0;
      setDisplayedAffirmation(selectedAffirmations[0]);
      triggerAffirmation();

      // Start lock screen notification
      const firstAffirmation = selectedAffirmations[0];
      notificationService.startSessionNotification('00:00', firstAffirmation.text);

      logger.success('Session initialized successfully (no map)');
    } catch (error: any) {
      logger.error('Failed to initialize session', error);
      Alert.alert('Error', error.message);
      router.back();
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          const { latitude, longitude, speed } = location.coords;

          // Update user location for map
          const newLocation = { latitude, longitude };
          setUserLocation(newLocation);

          // Set start location if not already set
          if (!startLocation) {
            setStartLocation(newLocation);
            // Set initial map region
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }

          // Animate map to follow user if enabled
          if (isFollowingUser && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 500);
          }

          // Add to route path
          addLocationToRoute({ latitude, longitude });

          // Update speed (convert m/s to km/h or mph)
          if (speed !== null && speed >= 0) {
            const speedKmh = speed * 3.6;
            const speedInUnit = sessionSettings?.distanceUnit === 'miles'
              ? speedKmh * 0.621371
              : speedKmh;
            updateSpeed(speedInUnit);
          }

          // Calculate distance using locationService
          const distanceInUnit = locationService.getDistance(
            sessionSettings?.distanceUnit || 'miles'
          );
          setDistance(distanceInUnit);

          // Check if distance interval has been reached
          if (
            sessionSettings?.intervalType === 'distance' &&
            sessionSettings.distanceInterval &&
            distanceInUnit - lastDistanceCheck.current >= sessionSettings.distanceInterval
          ) {
            lastDistanceCheck.current = distanceInUnit;
            triggerAffirmation();
          }
        }
      );
    } catch (error) {
      logger.error('Failed to start location tracking', error);
    }
  };

  const startTimeInterval = () => {
    if (sessionSettings?.timeInterval) {
      intervalRef.current = setInterval(() => {
        if (!isSessionPausedRef.current) {
          triggerAffirmation();
        }
      }, sessionSettings.timeInterval * 1000);
    }
  };

  const triggerAffirmation = async () => {
    if (selectedAffirmations.length === 0 || isSessionPausedRef.current) return;

    const latestSession = useSessionStore.getState().currentSession;
    const currentIndex = currentAffirmationIndexRef.current;

    // Get the actual affirmation index based on playback mode
    const indices = shuffledIndices.length > 0 ? shuffledIndices : selectedAffirmations.map((_, i) => i);
    const affirmationIndex = indices[currentIndex % indices.length];
    const affirmation = selectedAffirmations[affirmationIndex];

    setDisplayedAffirmation(affirmation);

    console.log('=== SESSION AFFIRMATION ===');
    console.log(`Playing: #${currentIndex + 1}/${selectedAffirmations.length}`);
    console.log(`Mode: ${sessionSettings?.repetitionMode || 'sequential'}`);
    console.log(`Text: "${affirmation.text}"`);
    console.log('===========================');

    // Calculate next index
    const nextIndex = (currentIndex + 1) % selectedAffirmations.length;

    // Re-shuffle when we complete a full cycle in random mode
    if (nextIndex === 0 && sessionSettings?.repetitionMode === 'random') {
      const newIndices = selectedAffirmations.map((_, i) => i);
      for (let i = newIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newIndices[i], newIndices[j]] = [newIndices[j], newIndices[i]];
      }
      setShuffledIndices(newIndices);
    }

    setCurrentAffirmationIndex(nextIndex);
    currentAffirmationIndexRef.current = nextIndex;

    // Reset timer
    lastAffirmationTime.current = Date.now();

    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    trackReplay(affirmation.id);

    // Update session state
    const currentPlayed = latestSession?.affirmationsPlayed || [];
    const newAffirmationsPlayed = currentPlayed.includes(affirmation.id)
      ? currentPlayed
      : [...currentPlayed, affirmation.id];

    updateSessionState({
      currentAffirmationIndex: currentIndex,
      affirmationsPlayed: newAffirmationsPlayed,
    });

    try {
      const shouldPlayChime = sessionSettings?.playChime ?? false;
      await audioService.playAffirmation(affirmation, shouldPlayChime);
      logger.success('Affirmation played', { id: affirmation.id, index: currentIndex });
    } catch (error) {
      logger.error('Failed to play affirmation', error);
    }
  };

  const handlePause = () => {
    pauseSession();
    audioService.pause();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleResume = () => {
    resumeSession();
    lastAffirmationTime.current = Date.now();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleFinish = async () => {
    cleanup();

    if (currentSession && user) {
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

      // Store session data for summary
      setSessionEndData({
        duration: currentSession.duration,
        distance: currentSession.distance,
        affirmationsCount: currentSession.affirmationsPlayed.length,
      });

      // Show post-workout mood modal if we have a mood entry
      const moodId = currentMoodEntryId || params.moodEntryId;
      if (moodId) {
        setShowPostMoodModal(true);
      } else {
        // No mood tracking, go straight to summary
        endSession();
        navigateToSummary(currentSession.duration, currentSession.distance, currentSession.affirmationsPlayed.length);
      }
    }
  };

  const handlePostMoodSubmit = async (rating: MoodRating) => {
    const moodId = currentMoodEntryId || params.moodEntryId;
    if (moodId) {
      await savePostWorkoutMood(rating, moodId);
    }
    setShowPostMoodModal(false);
    endSession();
    setMoodEntryId(null);

    if (sessionEndData) {
      navigateToSummary(
        sessionEndData.duration,
        sessionEndData.distance,
        sessionEndData.affirmationsCount,
        moodId ? getMoodImprovement(moodId) : null
      );
    }
  };

  const handlePostMoodSkip = () => {
    setShowPostMoodModal(false);
    endSession();
    setMoodEntryId(null);

    if (sessionEndData) {
      navigateToSummary(sessionEndData.duration, sessionEndData.distance, sessionEndData.affirmationsCount);
    }
  };

  const navigateToSummary = (
    duration: number,
    dist: number,
    affirmationsCount: number,
    moodImprovement?: number | null
  ) => {
    router.push({
      pathname: '/summary',
      params: {
        duration: duration.toString(),
        distance: dist.toString(),
        affirmationsCount: affirmationsCount.toString(),
        ...(moodImprovement !== null && moodImprovement !== undefined && {
          moodImprovement: moodImprovement.toString(),
        }),
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
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    locationService.stopTracking();
    audioService.cleanup();
    notificationService.stopSessionNotification();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentAffirmation = displayedAffirmation || selectedAffirmations[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session Active</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>{sessionSettings?.distanceUnit || 'miles'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{sessionSettings?.distanceUnit === 'miles' ? 'mph' : 'km/h'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentSession?.affirmationsPlayed.length || 0}</Text>
            <Text style={styles.statLabel}>played</Text>
          </View>
        </View>

        {/* Current Affirmation */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationLabel}>Current Affirmation</Text>
          <Text style={styles.affirmationText}>
            "{currentAffirmation?.text || 'Loading...'}"
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {mapRegion ? (
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                onPanDrag={() => setIsFollowingUser(false)}
                showsUserLocation={false}
                showsMyLocationButton={false}
              >
                {/* Route polyline */}
                {routePath.length > 1 && (
                  <Polyline
                    coordinates={routePath}
                    strokeColor={COLORS.primary}
                    strokeWidth={4}
                  />
                )}

                {/* Start marker */}
                {startLocation && (
                  <Marker
                    coordinate={startLocation}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.startMarker}>
                      <View style={styles.startMarkerInner} />
                    </View>
                  </Marker>
                )}

                {/* User location marker */}
                {userLocation && (
                  <Marker
                    coordinate={userLocation}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.userMarker}>
                      <View style={styles.userMarkerInner} />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Re-center button */}
              {!isFollowingUser && (
                <TouchableOpacity
                  style={styles.recenterButton}
                  onPress={() => {
                    setIsFollowingUser(true);
                    if (userLocation && mapRef.current) {
                      mapRef.current.animateToRegion({
                        ...userLocation,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      }, 500);
                    }
                  }}
                >
                  <Text style={styles.recenterButtonText}>Re-center</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.mapLoading}>
              <Text style={styles.mapLoadingText}>Acquiring GPS...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Control Buttons */}
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 20 }]}>
        {isSessionPaused ? (
          <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
            <Text style={styles.controlButtonText}>▶ Resume</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
            <Text style={styles.controlButtonText}>⏸ Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Post-Workout Mood Modal */}
      <MoodCheckModal
        visible={showPostMoodModal}
        type="post"
        onSubmit={handlePostMoodSubmit}
        onSkip={handlePostMoodSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 64,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  affirmationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  affirmationLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  affirmationText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 30,
    fontStyle: 'italic',
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  startMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(67, 160, 71, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#43A047',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  pauseButton: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#43A047',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finishButton: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
