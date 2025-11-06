import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore, OnboardingData } from '../store/onboardingStore';
import { affirmationService } from '../services/affirmationService';

const GOALS = [
  'Overcoming Anxiety',
  'Building Confidence',
  'Self-Love',
  'Focus & Motivation',
  'General Wellness',
];

const CATEGORIES = [
  'Overcoming Anxiety',
  'Depression',
  'Building Up Confidence',
  'Building Up Self-Worth',
  'Reinforcing Confidence and Self-Worth',
  'Believing in Oneself',
  'Self-Love',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { saveOnboarding, loadOnboarding } = useOnboardingStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    preferredCategories: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboarding();
    setIsLoading(false);
  }, []);

  const handleNext = () => {
    if (step === 1 && !data.primaryGoal) {
      Alert.alert('Please select a goal');
      return;
    }
    if (step === 2 && data.preferredCategories!.length === 0) {
      Alert.alert('Please select at least one category');
      return;
    }
    if (step < 4) {
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
      await saveOnboarding(data as OnboardingData);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error', 'Failed to save onboarding data');
    }
  };

  const toggleCategory = (category: string) => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome to Mental Victory Practice</Text>
      <Text style={styles.subtitle}>
        Let's personalize your experience ({step}/4)
      </Text>

      {step === 1 && (
        <View style={styles.step}>
          <Text style={styles.question}>What's your primary goal?</Text>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.option,
                data.primaryGoal === goal && styles.optionSelected,
              ]}
              onPress={() => setData({ ...data, primaryGoal: goal })}
            >
              <Text
                style={[
                  styles.optionText,
                  data.primaryGoal === goal && styles.optionTextSelected,
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 2 && (
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

      {step === 3 && (
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

      {step === 4 && (
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
          {step === 4 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  step: {
    marginBottom: 32,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  option: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  optionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  button: {
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 18,
  },
});

