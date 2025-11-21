import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoodRating } from '../store/moodStore';
import { COLORS } from '../constants/colors';
import * as Haptics from 'expo-haptics';

interface MoodSelectorProps {
  onSelect: (rating: MoodRating) => void;
  selectedRating?: MoodRating;
  title: string;
}

const MOOD_EMOJIS: Record<MoodRating, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '😄',
};

const MOOD_LABELS: Record<MoodRating, string> = {
  1: 'Not great',
  2: 'Okay',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

export default function MoodSelector({ onSelect, selectedRating, title }: MoodSelectorProps) {
  const handleSelect = async (rating: MoodRating) => {
    await Haptics.selectionAsync();
    onSelect(rating);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.moodContainer}>
        {(Object.keys(MOOD_EMOJIS) as unknown as MoodRating[]).map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.moodButton,
              selectedRating === rating && styles.moodButtonSelected,
            ]}
            onPress={() => handleSelect(rating)}
          >
            <Text style={styles.emoji}>{MOOD_EMOJIS[rating]}</Text>
            <Text
              style={[
                styles.label,
                selectedRating === rating && styles.labelSelected,
              ]}
            >
              {MOOD_LABELS[rating]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 24,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 12,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  moodButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  labelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});





