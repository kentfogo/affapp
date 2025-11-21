import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { storageService } from '../services/storageService';
import { SessionLog } from '../types/session';
import { formatTime } from '../utils/formatTime';
import { COLORS } from '../constants/colors';

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
  const { user } = useAuthStore();
  const duration = parseInt(params.duration as string) || 0;
  const distance = parseFloat(params.distance as string) || 0;
  const affirmationsCount = parseInt(params.affirmationsCount as string) || 0;
  
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadSessionStats();
  }, [user]);

  const loadSessionStats = async () => {
    if (!user) return;
    
    try {
      const allSessions = await storageService.getSessionLogs(user.uid, 1000);
      setTotalSessions(allSessions.length);
      
      // Calculate current streak
      const streak = calculateStreak(allSessions);
      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const calculateStreak = (sessions: SessionLog[]): number => {
    if (sessions.length === 0) return 0;
    
    // Get unique dates (by day, not timestamp)
    const sessionDates = new Set<string>();
    sessions.forEach((session) => {
      const date = new Date(session.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      sessionDates.add(dateKey);
    });

    const sortedDates = Array.from(sessionDates)
      .map((dateKey) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month, day).getTime();
      })
      .sort((a, b) => b - a); // Most recent first

    // Calculate current streak (from today backwards)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = today.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedDates.length; i++) {
      const sessionDate = new Date(sortedDates[i]);
      sessionDate.setHours(0, 0, 0, 0);
      const sessionTime = sessionDate.getTime();

      if (Math.abs(checkDate - sessionTime) < oneDay) {
        currentStreak++;
        checkDate -= oneDay;
      } else if (sessionTime < checkDate) {
        // Gap found, stop counting
        break;
      }
    }

    return currentStreak;
  };

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
        {/* Red Panda Image */}
        <Image
          source={require('../assets/red-panda.png')}
          style={styles.redPandaImage}
          resizeMode="contain"
        />

        <View style={styles.header}>
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.message}>{randomMessage}</Text>
        </View>

        {/* Session Stats */}
        <View style={styles.sessionStats}>
          <View style={styles.sessionStatCard}>
            <Text style={styles.sessionStatValue}>{totalSessions}</Text>
            <Text style={styles.sessionStatLabel}>Total Sessions</Text>
          </View>
          <View style={styles.sessionStatCard}>
            <Text style={styles.sessionStatValue}>{currentStreak}</Text>
            <Text style={styles.sessionStatLabel}>Day Streak</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 16,
    width: '100%',
  },
  sessionStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    maxWidth: 150,
  },
  sessionStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  sessionStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: COLORS.primary,
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
  encouragement: {
    backgroundColor: `${COLORS.primary}20`,
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  encouragementText: {
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

