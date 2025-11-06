import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { storageService } from '../../services/storageService';
import { SessionLog } from '../../types/session';
import { formatTime } from '../../utils/formatTime';

export default function ActivityScreen() {
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
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
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
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  timeframeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  timeframeButtonTextActive: {
    color: '#4CAF50',
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
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#F5F5F5',
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
    color: '#1A1A1A',
  },
  affirmationBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  affirmationBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionStat: {
    fontSize: 14,
    color: '#666666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 32,
  },
});

