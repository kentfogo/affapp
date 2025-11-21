import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { storageService } from '../../../services/storageService';
import { SessionLog } from '../../../types/session';
import { COLORS } from '../../../constants/colors';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const allSessions = await storageService.getSessionLogs(user.uid, 1000);
      setSessions(allSessions);
      setTotalSessions(allSessions.length);
      
      // Calculate streaks
      const { current, longest } = calculateStreaks(allSessions);
      setCurrentStreak(current);
      setLongestStreak(longest);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreaks = (sessions: SessionLog[]) => {
    if (sessions.length === 0) return { current: 0, longest: 0 };

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

    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const date1 = new Date(sortedDates[i]);
      const date2 = new Date(sortedDates[i + 1]);
      date1.setHours(0, 0, 0, 0);
      date2.setHours(0, 0, 0, 0);
      const diffDays = Math.abs(date1.getTime() - date2.getTime()) / oneDay;

      if (diffDays <= 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  };

  const getSessionDates = () => {
    const dates = new Set<string>();
    sessions.forEach((session) => {
      const date = new Date(session.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      dates.add(dateKey);
    });
    return dates;
  };

  const renderCalendar = () => {
    const sessionDates = getSessionDates();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Day headers
    const headers = dayNames.map((day, index) => (
      <View key={`header-${index}`} style={styles.calendarDayHeader}>
        <Text style={styles.calendarDayHeaderText}>{day}</Text>
      </View>
    ));

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(currentYear, currentMonth, day);
      checkDate.setHours(0, 0, 0, 0);
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      const hasSession = sessionDates.has(dateKey);
      const isToday = 
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      days.push(
        <View
          key={`day-${day}`}
          style={[
            styles.calendarDay,
            hasSession && styles.calendarDayWithSession,
            isToday && styles.calendarDayToday,
          ]}
        >
          <Text
            style={[
              styles.calendarDayText,
              hasSession && styles.calendarDayTextWithSession,
              isToday && styles.calendarDayTextToday,
            ]}
          >
            {day}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonthText}>
            {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.calendarGrid}>
          {headers}
          {days}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your consistency</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statSubtext}>days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
          <Text style={styles.statSubtext}>days</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>Session Calendar</Text>
        {renderCalendar()}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotSession]} />
            <Text style={styles.legendText}>Session completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotToday]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    marginBottom: 32,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calendarSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  calendarContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarDayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDayWithSession: {
    backgroundColor: `${COLORS.primary}30`,
    borderRadius: 8,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: COLORS.text,
  },
  calendarDayTextWithSession: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotSession: {
    backgroundColor: `${COLORS.primary}30`,
  },
  legendDotToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

