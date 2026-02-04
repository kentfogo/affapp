import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoodRating } from '../store/moodStore';
import { COLORS } from '../constants/colors';
import * as Haptics from 'expo-haptics';

interface MoodSelectorProps {
  onSelect: (rating: MoodRating) => void;
  selectedRating?: MoodRating;
  title: string;
}

// Updated to 4 options: Not Great (1), Okay (2), Good (3), Great (4)
const MOOD_OPTIONS: { rating: MoodRating; emoji: string; label: string }[] = [
  { rating: 1, emoji: '😞', label: 'Not Great' },
  { rating: 2, emoji: '😐', label: 'Okay' },
  { rating: 3, emoji: '😊', label: 'Good' },
  { rating: 4, emoji: '😄', label: 'Great' },
];

export default function MoodSelector({ onSelect, selectedRating, title }: MoodSelectorProps) {
  const handleSelect = async (rating: MoodRating) => {
    await Haptics.selectionAsync();
    onSelect(rating);
  };

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.moodContainer}>
        {MOOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.rating}
            style={[
              styles.moodButton,
              selectedRating === option.rating && styles.moodButtonSelected,
            ]}
            onPress={() => handleSelect(option.rating)}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.label,
                selectedRating === option.rating && styles.labelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 24,
  },
  moodContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  moodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
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
    marginRight: 16,
  },
  label: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '500',
  },
  labelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
