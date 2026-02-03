import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    await Haptics.selectionAsync();
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
            {/* Red Panda Image */}
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
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 24,
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today's Journey</Text>
          <Text style={styles.subtitle}>Keep moving, keep growing</Text>
        </View>

        <View style={styles.centeredContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ready to Start?</Text>
            <Text style={styles.cardText}>
              {selectedAffirmations.length === 0
                ? 'Select 1-10 affirmations to begin'
                : `You have ${selectedAffirmations.length} affirmations selected`}
            </Text>

            {!canStartSession && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSelectAffirmations}
              >
                <Text style={styles.secondaryButtonText}>
                  {selectedAffirmations.length === 0
                    ? 'Choose Affirmations'
                    : 'Manage Affirmations'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                !canStartSession && styles.buttonDisabled,
              ]}
              onPress={handleStartSession}
              disabled={!canStartSession}
            >
              <Text style={styles.buttonText}>Let's Go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  quoteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1F1F1F',
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
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 24,
  },
  author: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  header: {
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    marginTop: -60,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

