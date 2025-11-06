import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatTime } from '../utils/formatTime';

const REINFORCEMENT_MESSAGES = [
  "Amazing work! You're building positive momentum with every step.",
  "You did it! Your commitment to growth is inspiring.",
  "Fantastic! You're creating powerful change in your life.",
  "Well done! Each session brings you closer to your goals.",
  "Incredible! You're investing in yourself, and it shows.",
  "Outstanding! Your dedication to self-improvement is remarkable.",
  "Brilliant! You're transforming your mindset one affirmation at a time.",
  "Excellent! Keep this positive energy flowing.",
  "Wonderful! You're on an incredible journey of self-discovery.",
  "Phenomenal! Your consistency is creating real change.",
];

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const duration = parseInt(params.duration as string) || 0;
  const distance = parseFloat(params.distance as string) || 0;
  const affirmationsCount = parseInt(params.affirmationsCount as string) || 0;

  const randomMessage =
    REINFORCEMENT_MESSAGES[
      Math.floor(Math.random() * REINFORCEMENT_MESSAGES.length)
    ];

  const handleDone = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.message}>{randomMessage}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          {distance > 0 && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          )}
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{affirmationsCount}</Text>
            <Text style={styles.statLabel}>Affirmations Heard</Text>
          </View>
        </View>

        <View style={styles.encouragement}>
          <Text style={styles.encouragementText}>
            You've taken another step toward a more positive mindset. Keep going!
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleDone}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#4CAF50',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 48,
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  encouragement: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  encouragementText: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

