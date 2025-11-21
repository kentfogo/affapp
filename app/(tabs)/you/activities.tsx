import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { storageService } from '../../../services/storageService';
import { SessionLog } from '../../../types/session';
import { formatTime } from '../../../utils/formatTime';
import { COLORS } from '../../../constants/colors';

export default function ActivitiesScreen() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadSessions();
  }, [user, timeframe]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const allSessions = await storageService.getSessionLogs(user.uid, 100);
      
      const now = Date.now();
      const filtered = allSessions.filter((session) => {
        if (timeframe === 'week') {
          return now - session.createdAt < 7 * 24 * 60 * 60 * 1000;
        } else if (timeframe === 'month') {
          return now - session.createdAt < 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });

      setSessions(filtered);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => {
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
    const totalAffirmations = sessions.reduce(
      (sum, s) => sum + s.affirmationsPlayed.length,
      0
    );
    return { totalTime, totalDistance, totalAffirmations };
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Reset time to midnight for accurate day comparison
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowMidnight.getTime() - dateMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // For older dates, show formatted date (e.g., "Jan 15")
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = getStats();

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Activity</Text>
        <Text style={styles.subtitle}>Track your mindful movement</Text>
      </View>

      <View style={styles.timeframeSelector}>
        <TouchableOpacity
          style={[
            styles.timeframeButton,
            timeframe === 'week' && styles.timeframeButtonActive,
          ]}
          onPress={() => setTimeframe('week')}
        >
          <Text
            style={[
              styles.timeframeButtonText,
              timeframe === 'week' && styles.timeframeButtonTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeframeButton,
            timeframe === 'month' && styles.timeframeButtonActive,
          ]}
          onPress={() => setTimeframe('month')}
        >
          <Text
            style={[
              styles.timeframeButtonText,
              timeframe === 'month' && styles.timeframeButtonTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeframeButton,
            timeframe === 'all' && styles.timeframeButtonActive,
          ]}
          onPress={() => setTimeframe('all')}
        >
          <Text
            style={[
              styles.timeframeButtonText,
              timeframe === 'all' && styles.timeframeButtonTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {stats.totalDistance.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalAffirmations}</Text>
          <Text style={styles.statLabel}>Affirmations</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {isLoading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : sessions.length === 0 ? (
          <Text style={styles.emptyText}>No sessions yet. Start your first session!</Text>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>{formatDate(session.createdAt)}</Text>
                <View style={styles.affirmationBadge}>
                  <Text style={styles.affirmationBadgeText}>
                    {session.affirmationsPlayed.length} affirmations
                  </Text>
                </View>
              </View>
              <View style={styles.sessionStats}>
                <Text style={styles.sessionStat}>
                  Duration {formatTime(session.duration)}
                </Text>
                {session.distance > 0 && (
                  <Text style={styles.sessionStat}>
                    Distance {session.distance.toFixed(2)} mi
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
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
  timeframeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  timeframeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  timeframeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timeframeButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  affirmationBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  affirmationBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionStat: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});


