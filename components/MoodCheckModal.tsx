import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MoodSelector from './MoodSelector';
import { MoodRating } from '../store/moodStore';
import { COLORS } from '../constants/colors';

interface MoodCheckModalProps {
  visible: boolean;
  type: 'pre' | 'post';
  onSubmit: (rating: MoodRating) => void;
  onSkip?: () => void;
  improvement?: number | null; // For post-workout, show improvement
}

export default function MoodCheckModal({
  visible,
  type,
  onSubmit,
  onSkip,
  improvement,
}: MoodCheckModalProps) {
  const [selectedRating, setSelectedRating] = useState<MoodRating | undefined>();

  const handleSubmit = async () => {
    if (selectedRating) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSubmit(selectedRating);
      setSelectedRating(undefined);
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setSelectedRating(undefined);
    onSkip?.();
  };

  const title = type === 'pre'
    ? 'How are you feeling?'
    : 'How do you feel now?';

  const subtitle = type === 'pre'
    ? 'Check in before your session'
    : 'Rate your mood after your session';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{type === 'pre' ? '🌅' : '🌟'}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <MoodSelector
          onSelect={setSelectedRating}
          selectedRating={selectedRating}
          title=""
        />

        {type === 'post' && improvement !== null && improvement !== undefined && (
          <View style={styles.improvementContainer}>
            <Text style={styles.improvementLabel}>Mood Change</Text>
            <Text style={[
              styles.improvementValue,
              improvement > 0 && styles.improvementPositive,
              improvement < 0 && styles.improvementNegative,
            ]}>
              {improvement > 0 ? '+' : ''}{improvement}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedRating && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedRating}
          >
            <Text style={styles.submitButtonText}>
              {type === 'pre' ? 'Start Session' : 'Continue'}
            </Text>
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
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
    textAlign: 'center',
  },
  improvementContainer: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    marginHorizontal: 24,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  improvementLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  improvementValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  improvementPositive: {
    color: '#4CAF50',
  },
  improvementNegative: {
    color: '#F44336',
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  submitButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  skipButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
