import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore, OnboardingData } from '../store/onboardingStore';
import { useSessionStore } from '../store/sessionStore';
import { useAffirmationAnalyticsStore } from '../store/affirmationAnalyticsStore';
import { storageService } from '../services/storageService';
import { affirmationService } from '../services/affirmationService';
import { Affirmation } from '../types/affirmation';
import { BACKGROUNDS } from '../constants/backgrounds';
import { COLORS } from '../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;
const TOTAL_STEPS = 4;

const CATEGORIES = [
  'Overcoming Anxiety',
  'Building Confidence',
  'Self-Love',
  'Focus & Motivation',
  'General Wellness',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveOnboarding, loadOnboarding, saveSelectedAffirmations } = useOnboardingStore();
  const { selectedAffirmations, setSelectedAffirmations } = useSessionStore();
  const { trackAccept, trackReject, loadAnalytics } = useAffirmationAnalyticsStore();

  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState('sunset');
  const [voicePreference] = useState<'tts' | 'recorded'>('tts');
  const [unitPreference, setUnitPreference] = useState<'miles' | 'kilometers'>('miles');

  // Affirmation selection state
  const [filteredAffirmations, setFilteredAffirmations] = useState<Affirmation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const currentIndexRef = useRef(0);
  const filteredAffirmationsRef = useRef<Affirmation[]>([]);
  const doneButtonScale = useRef(new Animated.Value(0)).current;
  const isButtonVisible = useRef(false);

  // Step 2 swipe animation values
  const step2SlideY = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(1)).current;
  const step2IsAnimating = useRef(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboarding();
    loadAnalytics();
    setIsLoading(false);
  }, []);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    filteredAffirmationsRef.current = filteredAffirmations;
  }, [filteredAffirmations]);

  // Load affirmations when entering step 2
  useEffect(() => {
    if (step === 2) {
      loadAffirmations();
    }
  }, [step]);

  // Show Done button when 5+ selected
  useEffect(() => {
    const shouldShow = selectedIds.size >= 5;
    if (shouldShow && !isButtonVisible.current) {
      isButtonVisible.current = true;
      Animated.spring(doneButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && isButtonVisible.current) {
      isButtonVisible.current = false;
      Animated.timing(doneButtonScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedIds.size]);

  const loadAffirmations = async () => {
    try {
      const all = affirmationService.getFilteredAffirmations(CATEGORIES);
      setFilteredAffirmations(all);
      filteredAffirmationsRef.current = all;
    } catch (error) {
      console.error('Error loading affirmations:', error);
    }
  };

  const handleHaptic = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleNext = async () => {
    await handleHaptic();

    if (step === 1) {
      if (!userName.trim()) {
        Alert.alert('Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedIds.size < 5) {
        Alert.alert('Select at least 5 mantras', 'Tap the heart on affirmations you love!');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      handleComplete();
    }
  };

  const handleBack = async () => {
    await handleHaptic();
    if (step > 1) setStep(step - 1);
  };

  // ─── Step 2: swipe-up/down navigation ───
  const step2AnimateTransition = (direction: 'up' | 'down') => {
    if (step2IsAnimating.current) return;
    step2IsAnimating.current = true;
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const exitTo = direction === 'up' ? -SCREEN_HEIGHT * 0.4 : SCREEN_HEIGHT * 0.4;
    const enterFrom = direction === 'up' ? SCREEN_HEIGHT * 0.15 : -SCREEN_HEIGHT * 0.15;

    Animated.parallel([
      Animated.timing(step2SlideY, { toValue: exitTo, duration: 250, useNativeDriver: true }),
      Animated.timing(step2Opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      const total = filteredAffirmationsRef.current.length;
      setCurrentIndex(prev => {
        const next = direction === 'up'
          ? (prev < total - 1 ? prev + 1 : 0)
          : (prev > 0 ? prev - 1 : total - 1);
        currentIndexRef.current = next;
        return next;
      });

      step2SlideY.setValue(enterFrom);

      Animated.parallel([
        Animated.spring(step2SlideY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 65 }),
        Animated.timing(step2Opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        step2IsAnimating.current = false;
      });
    });
  };

  const step2PanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (!step2IsAnimating.current) {
          step2SlideY.setValue(g.dy * 0.6);
          const progress = Math.min(Math.abs(g.dy) / 200, 1);
          step2Opacity.setValue(1 - progress * 0.4);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (step2IsAnimating.current) return;
        if (g.dy < -SWIPE_THRESHOLD || (g.dy < -40 && g.vy < -0.5)) {
          step2AnimateTransition('up');
        } else if (g.dy > SWIPE_THRESHOLD || (g.dy > 40 && g.vy > 0.5)) {
          step2AnimateTransition('down');
        } else {
          Animated.parallel([
            Animated.spring(step2SlideY, { toValue: 0, useNativeDriver: true, friction: 7 }),
            Animated.timing(step2Opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, friction: 3, tension: 200 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const handleHeartPress = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const affirmation = filteredAffirmations[currentIndex];
    if (!affirmation) return;

    animateHeart();

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(affirmation.id)) {
        next.delete(affirmation.id);
        trackReject(affirmation.id);
      } else {
        if (next.size >= 10) {
          Alert.alert('Maximum Reached', 'You can select up to 10 affirmations');
          return prev;
        }
        next.add(affirmation.id);
        trackAccept(affirmation.id);
      }
      return next;
    });
  };

  const handleComplete = async () => {
    try {
      const selectedAffirmationObjects = filteredAffirmations.filter(aff =>
        selectedIds.has(aff.id)
      );
      const derivedCategories = [...new Set(selectedAffirmationObjects.map(a => a.category))];

      const onboardingData: OnboardingData = {
        userName: userName.trim(),
        backgroundId: selectedBackgroundId,
        preferredCategories: derivedCategories,
        voicePreference,
        unitPreference,
      };

      await saveOnboarding(onboardingData);

      const selectedArray = Array.from(selectedIds);
      await saveSelectedAffirmations(selectedArray);
      setSelectedAffirmations(selectedAffirmationObjects);
      await storageService.saveSelectedAffirmations(selectedAffirmationObjects);

      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const progress = step / TOTAL_STEPS;
  const currentAffirmation = filteredAffirmations[currentIndex];
  const isCurrentSelected = currentAffirmation ? selectedIds.has(currentAffirmation.id) : false;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[
          styles.progressBarFill,
          { width: `${progress * 100}%` },
        ]} />
      </View>

      {/* Skip / Back row */}
      <View style={styles.topRow}>
        {step > 1 ? (
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {step === 2 || step === 3 ? (
          <TouchableOpacity onPress={handleNext}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Step Content */}
      <KeyboardAvoidingView
        style={styles.contentArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Step 1: Name ─── */}
        {step === 1 && (
          <ScrollView
            contentContainerStyle={styles.stepContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require('../assets/red-panda.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
            <Text style={styles.questionText}>What's your name?</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textSecondary}
              value={userName}
              onChangeText={setUserName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
            <View style={styles.buttonSpacer} />
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Step 2: Full-screen swipe affirmation picker ─── */}
        {step === 2 && (
          <View style={styles.step2Container}>
            {/* Counter pill */}
            <View style={styles.step2TopBar}>
              <View style={styles.step2CounterPill}>
                <Ionicons
                  name={selectedIds.size > 0 ? 'heart' : 'heart-outline'}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.step2CounterText}>{selectedIds.size}/10 selected</Text>
              </View>
            </View>

            {/* Swipeable affirmation text */}
            <Animated.View
              style={[
                styles.step2Center,
                {
                  transform: [{ translateY: step2SlideY }],
                  opacity: step2Opacity,
                },
              ]}
              {...step2PanResponder.panHandlers}
            >
              {currentAffirmation && (
                <>
                  <Text style={styles.step2AffirmationText}>{currentAffirmation.text}</Text>
                  <Text style={styles.step2CategoryText}>
                    {currentAffirmation.category.toUpperCase()}
                  </Text>
                </>
              )}
            </Animated.View>

            {/* Swipe hint */}
            <View style={styles.step2HintRow}>
              <Ionicons name="chevron-up" size={16} color={COLORS.textSecondary} />
              <Text style={styles.step2HintText}>Swipe to browse</Text>
            </View>

            {/* Heart + Done button */}
            <View style={styles.step2Bottom}>
              <TouchableOpacity onPress={handleHeartPress} activeOpacity={0.7}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={isCurrentSelected ? 'heart' : 'heart-outline'}
                    size={52}
                    color={isCurrentSelected ? '#E53935' : COLORS.textSecondary}
                  />
                </Animated.View>
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.doneButtonWrapper,
                  {
                    transform: [{ scale: doneButtonScale }],
                    opacity: doneButtonScale,
                  },
                ]}
              >
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Next →</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}

        {/* ─── Step 3: Background Picker ─── */}
        {step === 3 && (
          <ScrollView contentContainerStyle={styles.stepContainer}>
            <Image
              source={require('../assets/red-panda.png')}
              style={styles.mascotSmall}
              resizeMode="contain"
            />
            <Text style={styles.questionText}>Choose your vibe</Text>
            <Text style={styles.subtitleText}>
              This will be your mantras background
            </Text>

            <View style={styles.backgroundGrid}>
              {BACKGROUNDS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={[
                    styles.backgroundOption,
                    selectedBackgroundId === bg.id && styles.backgroundOptionSelected,
                  ]}
                  onPress={async () => {
                    if (Platform.OS !== 'web') await Haptics.selectionAsync();
                    setSelectedBackgroundId(bg.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={bg.source} style={styles.backgroundThumb} />
                  {selectedBackgroundId === bg.id && (
                    <View style={styles.checkOverlay}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.backgroundLabel}>{bg.label}</Text>
                </TouchableOpacity>
              ))}
              {/* Invisible placeholder to balance 3-column grid (5 items → add 1 ghost) */}
              <View style={[styles.backgroundOption, { opacity: 0 }]} pointerEvents="none" />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Step 4: Units only (voice preference removed) ─── */}
        {step === 4 && (
          <ScrollView contentContainerStyle={styles.stepContainer}>
            <Image
              source={require('../assets/red-panda.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
            <Text style={styles.questionText}>Almost there!</Text>
            <Text style={styles.subtitleText}>Just one quick preference</Text>

            {/* Unit Preference */}
            <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Preferred distance unit</Text>
            <View style={styles.unitRow}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  unitPreference === 'miles' && styles.unitButtonSelected,
                ]}
                onPress={async () => {
                  if (Platform.OS !== 'web') await Haptics.selectionAsync();
                  setUnitPreference('miles');
                }}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    unitPreference === 'miles' && styles.unitButtonTextSelected,
                  ]}
                >
                  Miles
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  unitPreference === 'kilometers' && styles.unitButtonSelected,
                ]}
                onPress={async () => {
                  if (Platform.OS !== 'web') await Haptics.selectionAsync();
                  setUnitPreference('kilometers');
                }}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    unitPreference === 'kilometers' && styles.unitButtonTextSelected,
                  ]}
                >
                  Kilometers
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonSpacer} />

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                * This app provides positive affirmations and is not a substitute for
                professional medical advice, diagnosis, or treatment.
              </Text>
            </View>

            <TouchableOpacity style={[styles.nextButton, styles.getStartedButton]} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Get Started</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  darkContainer: {
    backgroundColor: '#1A1A2E',
  },

  // ─── Progress Bar ───
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },
  progressBarFillDark: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // ─── Top Row ───
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  lightText: {
    color: 'rgba(255,255,255,0.7)',
  },

  // ─── Content ───
  contentArea: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ─── Mascot ───
  mascot: {
    width: 100,
    height: 100,
    marginTop: 20,
    marginBottom: 24,
  },
  mascotSmall: {
    width: 70,
    height: 70,
    marginTop: 8,
    marginBottom: 12,
  },

  // ─── Typography ───
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 8,
  },

  // ─── Step 1: Name Input ───
  nameInput: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonSpacer: {
    flex: 1,
    minHeight: 40,
  },

  // ─── Step 2: Full-screen swipe picker ───
  step2Container: {
    flex: 1,
  },
  step2TopBar: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  step2CounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  step2CounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  step2Center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  step2AffirmationText: {
    fontSize: 30,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 44,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  step2CategoryText: {
    marginTop: 16,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  step2HintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingBottom: 12,
  },
  step2HintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  step2Bottom: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  doneButtonWrapper: {
    width: SCREEN_WIDTH - 48,
    paddingHorizontal: 0,
  },

  // ─── Step 3: Background Grid ───
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  backgroundOption: {
    width: (SCREEN_WIDTH - 48 - 16) / 3, // 3 columns with 2×8px gaps
    aspectRatio: 0.82,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  backgroundOptionSelected: {
    borderColor: COLORS.primary,
  },
  backgroundThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  checkMark: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backgroundLabel: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ─── Step 4: Unit selector ───
  unitRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  unitButton: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  unitButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  unitButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  unitButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ─── Disclaimer ───
  disclaimer: {
    width: '100%',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // ─── Next Button (shared across steps) ───
  nextButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButton: {
    height: 60,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
