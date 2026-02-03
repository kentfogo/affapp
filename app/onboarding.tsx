import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore, OnboardingData } from '../store/onboardingStore';
import { useSessionStore } from '../store/sessionStore';
import { storageService } from '../services/storageService';
import { affirmationService } from '../services/affirmationService';
import { COLORS } from '../constants/colors';

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
  const { saveOnboarding, loadOnboarding } = useOnboardingStore();
  const { selectedAffirmations } = useSessionStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    preferredCategories: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboarding();
    setIsLoading(false);
  }, []);

  const handleNext = async () => {
    // Add haptic feedback (skip on web)
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (step === 1 && data.preferredCategories!.length === 0) {
      Alert.alert('Please select at least one category');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!data.voicePreference || !data.unitPreference) {
      Alert.alert('Please complete all selections');
      return;
    }

    try {
      console.log('=== ONBOARDING COMPLETE - NAVIGATION DEBUG ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Saving onboarding data...');
      await saveOnboarding(data as OnboardingData);
      console.log('✅ Onboarding data saved');

      // Check both sessionStore and storageService for affirmations
      console.log('Checking for existing affirmations...');
      console.log('- selectedAffirmations (from store):', selectedAffirmations.length);
      
      const storedAffirmations = await storageService.getSelectedAffirmations();
      console.log('- storedAffirmations (from storage):', storedAffirmations.length);
      
      const hasAffirmations = selectedAffirmations.length > 0 || storedAffirmations.length > 0;
      console.log('- hasAffirmations:', hasAffirmations);

      // Smart navigation based on affirmation selection status
      if (!hasAffirmations) {
        console.log('🔄 No affirmations found - navigating to affirmations screen');
        console.log('Navigation route: /(tabs)/affirmations');
        router.replace('/(tabs)/affirmations');

        // Show helpful guidance message
        setTimeout(() => {
          console.log('📢 Showing affirmation selection guidance alert');
          Alert.alert(
            'Select Your Affirmations',
            'Choose 5-10 affirmations to begin your journey!',
            [{ text: 'Got it!', style: 'default' }]
          );
        }, 500);
      } else {
        console.log('✅ Affirmations already selected - navigating to home');
        console.log('Navigation route: /(tabs)/home');
        router.replace('/(tabs)/home');
      }
      console.log('=== END NAVIGATION DEBUG ===');
    } catch (error) {
      console.error('❌ Onboarding completion error:', error);
      Alert.alert('Error', 'Failed to save onboarding data');
    }
  };

  const toggleCategory = async (category: string) => {
    // Add haptic feedback (skip on web)
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    setData((prev) => {
      const categories = prev.preferredCategories || [];
      const updated = categories.includes(category)
        ? categories.filter((c) => c !== category)
        : [...categories, category];
      return { ...prev, preferredCategories: updated };
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 24,
      }}
    >
      <Text style={styles.title}>Welcome to Mental Victory Practice</Text>
      <Text style={styles.subtitle}>
        Let's personalize your experience ({step}/3)
      </Text>

      {step === 1 && (
        <View style={styles.step}>
          <Text style={styles.question}>
            Which affirmation categories interest you? (Select all that apply)
          </Text>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.option,
                data.preferredCategories?.includes(category) &&
                  styles.optionSelected,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text
                style={[
                  styles.optionText,
                  data.preferredCategories?.includes(category) &&
                    styles.optionTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <Text style={styles.question}>How would you like to hear affirmations?</Text>
          <TouchableOpacity
            style={[
              styles.option,
              data.voicePreference === 'tts' && styles.optionSelected,
            ]}
            onPress={() => setData({ ...data, voicePreference: 'tts' })}
          >
            <Text
              style={[
                styles.optionText,
                data.voicePreference === 'tts' && styles.optionTextSelected,
              ]}
            >
              Text-to-Speech (App Voice)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.option,
              data.voicePreference === 'recorded' && styles.optionSelected,
            ]}
            onPress={() => setData({ ...data, voicePreference: 'recorded' })}
          >
            <Text
              style={[
                styles.optionText,
                data.voicePreference === 'recorded' && styles.optionTextSelected,
              ]}
            >
              Record My Own Voice
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.step}>
          <Text style={styles.question}>Preferred distance unit?</Text>
          <TouchableOpacity
            style={[
              styles.option,
              data.unitPreference === 'miles' && styles.optionSelected,
            ]}
            onPress={() => setData({ ...data, unitPreference: 'miles' })}
          >
            <Text
              style={[
                styles.optionText,
                data.unitPreference === 'miles' && styles.optionTextSelected,
              ]}
            >
              Miles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.option,
              data.unitPreference === 'kilometers' && styles.optionSelected,
            ]}
            onPress={() => setData({ ...data, unitPreference: 'kilometers' })}
          >
            <Text
              style={[
                styles.optionText,
                data.unitPreference === 'kilometers' && styles.optionTextSelected,
              ]}
            >
              Kilometers
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          * This app provides positive affirmations and is not a substitute for
          professional medical advice, diagnosis, or treatment.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {step === 3 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    // Padding now handled inline with safe area insets
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  step: {
    marginBottom: 32,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 24,
  },
  option: {
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  disclaimer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.accent,
    lineHeight: 18,
  },
});

