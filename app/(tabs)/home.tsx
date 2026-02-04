import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '../../store/sessionStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useMoodStore, MoodRating } from '../../store/moodStore';
import { storageService } from '../../services/storageService';
import { SessionSettings } from '../../types/session';
import SessionSettingsModal from '../../components/SessionSettingsModal';
import MoodCheckModal from '../../components/MoodCheckModal';
import { COLORS } from '../../constants/colors';

const HAS_SEEN_QUOTE_KEY = '@has_seen_quote';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedAffirmations, sessionSettings, setSelectedAffirmations, setSessionSettings } = useSessionStore();
  const { data: onboardingData } = useOnboardingStore();
  const { savePreWorkoutMood } = useMoodStore();
  const [showQuote, setShowQuote] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<SessionSettings | null>(null);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Load saved affirmations and settings
    const loadData = async () => {
      const affirmations = await storageService.getSelectedAffirmations();
      const settings = await storageService.getSessionSettings();
      if (affirmations.length > 0) {
        setSelectedAffirmations(affirmations);
      }
      if (settings) {
        setSessionSettings(settings);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Check if user has seen quote before
    const checkQuoteStatus = async () => {
      try {
        const hasSeenQuote = await AsyncStorage.getItem(HAS_SEEN_QUOTE_KEY);
        if (!hasSeenQuote) {
          // First time opening app - show quote
          setShowQuote(true);
          // Mark as seen
          await AsyncStorage.setItem(HAS_SEEN_QUOTE_KEY, 'true');

          // Fade out quote after 2 seconds
          const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              setShowQuote(false);
            });
          }, 2000);

          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error checking quote status:', error);
      }
    };
    checkQuoteStatus();
  }, []);

  const handleSelectAffirmations = async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/affirmations');
  };

  const handleStartSession = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSettingsModal(true);
  };

  const handleConfirmSettings = async (settings: SessionSettings) => {
    setSessionSettings(settings);
    await storageService.saveSessionSettings(settings);
    setShowSettingsModal(false);
    setPendingSettings(settings);
    setShowMoodModal(true);
  };

  const handleMoodSubmit = async (rating: MoodRating) => {
    const moodEntryId = await savePreWorkoutMood(rating);
    setShowMoodModal(false);
    setPendingSettings(null);
    router.push({
      pathname: '/session',
      params: { moodEntryId },
    });
  };

  const handleMoodSkip = () => {
    setShowMoodModal(false);
    setPendingSettings(null);
    router.push('/session');
  };

  const canStartSession = selectedAffirmations.length > 0 && selectedAffirmations.length <= 10;

  const QUOTE = "Your brain believes what you tell it most. And what you tell it about you, it will create";
  const AUTHOR = "Shannon L. Adler";

  return (
    <View style={styles.container}>
      {showQuote && (
        <Animated.View
          style={[
            styles.quoteOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.quoteContent}>
            <Image
              source={require('../../assets/red-panda.png')}
              style={styles.redPandaImage}
              resizeMode="contain"
            />
            <Text style={styles.quote}>{QUOTE}</Text>
            <Text style={styles.author}>— {AUTHOR}</Text>
          </View>
        </Animated.View>
      )}

      {/* Background Image with Fade */}
      <ImageBackground
        source={require('../../assets/red-panda.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="contain"
      >
        {/* Header - lowered */}
        <View style={[styles.navHeader, { paddingTop: insets.top + 40 }]}>
          <Text style={styles.navTitle}>Practice</Text>
        </View>

        {/* Centered Content */}
        <View style={styles.mainContent}>
          {/* Session Info */}
          <View style={styles.sessionInfo}>
            {selectedAffirmations.length === 0 ? (
              <>
                <Text style={styles.sessionLabelEmpty}>No affirmations selected</Text>
                <TouchableOpacity onPress={handleSelectAffirmations}>
                  <Text style={styles.selectLink}>Select affirmations</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.sessionLabelReady}>
                {selectedAffirmations.length} affirmation{selectedAffirmations.length !== 1 ? 's' : ''} ready
              </Text>
            )}
          </View>

          {/* Big START Button */}
          <View style={styles.startButtonContainer}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={28} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startButton,
                !canStartSession && styles.startButtonDisabled,
              ]}
              onPress={handleStartSession}
              disabled={!canStartSession}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.startButtonText,
                !canStartSession && styles.startButtonTextDisabled,
              ]}>START</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryButton}
              onPress={handleSelectAffirmations}
            >
              <Ionicons name="book-outline" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <SessionSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onStartSession={handleConfirmSettings}
        initialSettings={sessionSettings || undefined}
        defaultDistanceUnit={onboardingData?.unitPreference || 'miles'}
      />

      <MoodCheckModal
        visible={showMoodModal}
        type="pre"
        onSubmit={handleMoodSubmit}
        onSkip={handleMoodSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.06,
    position: 'absolute',
    top: '-10%',
    left: '-25%',
    width: '150%',
    height: '120%',
  },
  navHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  quoteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  quoteContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  redPandaImage: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  quote: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.surface,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 24,
  },
  author: {
    fontSize: 16,
    color: COLORS.surface,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sessionLabelEmpty: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  sessionLabelReady: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  selectLink: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
  },
  startButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  settingsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  startButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    letterSpacing: 2,
  },
  startButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  libraryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
