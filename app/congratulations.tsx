import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatTime } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function CongratulationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const duration = parseInt(params.duration as string) || 0;
  const distance = parseFloat(params.distance as string) || 0;
  const affirmationsCount = parseInt(params.affirmationsCount as string) || 0;

  const handleContinue = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Red Panda Image */}
        <Image
          source={require('../assets/red-panda.png')}
          style={styles.redPandaImage}
          resizeMode="contain"
        />

        {/* Medal Icon */}
        <View style={styles.medalContainer}>
          <Ionicons name="medal" size={80} color={COLORS.primary} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>You've completed your first session!</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1st Session</Text>
          </View>
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
            <Text style={styles.statLabel}>Affirmations</Text>
          </View>
        </View>

        <View style={styles.message}>
          <Text style={styles.messageText}>
            You've taken the first step on your journey to a more positive mindset. 
            Every session builds on the last. Keep going!
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redPandaImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  medalContainer: {
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    width: '100%',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  message: {
    backgroundColor: `${COLORS.primary}20`,
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
});



