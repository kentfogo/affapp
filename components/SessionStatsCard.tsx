import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { formatTime } from '../utils/formatTime';

interface SessionStatsCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  elapsedTime: number;
  distance: number;
  distanceUnit: 'miles' | 'kilometers';
  currentSpeed: number;
  affirmationsCount: number;
  currentAffirmation: string;
  isSessionActive: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onFinish?: () => void;
  isPaused?: boolean;
}

export default function SessionStatsCard({
  isExpanded,
  onToggle,
  elapsedTime,
  distance,
  distanceUnit,
  currentSpeed,
  affirmationsCount,
  currentAffirmation,
  isSessionActive,
  onPause,
  onResume,
  onFinish,
  isPaused = false,
}: SessionStatsCardProps) {
  const panelHeight = useRef(new Animated.Value(160)).current; // Start at compact height

  useEffect(() => {
    const toValue = isExpanded ? 500 : 160;
    
    Animated.spring(panelHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  }, [isExpanded, panelHeight]);

  return (
    <Animated.View style={[styles.container, { height: panelHeight }]}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onToggle}
        style={styles.panelTouchable}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        {isExpanded ? (
          // Expanded View
          <View style={styles.expandedContent}>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isPaused ? 'Paused' : 'Active'}
              </Text>
            </View>

            {/* Large Time Display */}
            <Text style={styles.largeTime}>{formatTime(elapsedTime)}</Text>

            {/* Current Affirmation */}
            <View style={styles.affirmationSection}>
              <Text style={styles.affirmationText}>
                "{currentAffirmation}"
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>
                  {currentSpeed > 0 ? currentSpeed.toFixed(1) : '---'}
                </Text>
                <Text style={styles.statLabel}>
                  Avg speed ({distanceUnit === 'miles' ? 'mph' : 'km/h'})
                </Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>
                  {distance.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>
                  Distance ({distanceUnit === 'miles' ? 'mi' : 'km'})
                </Text>
              </View>
            </View>

            {/* Control Buttons */}
            {isSessionActive && (
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={[styles.controlButton, styles.resumeButton]}
                  onPress={isPaused ? onResume : onPause}
                >
                  <Text style={styles.controlButtonText}>
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.finishButton]}
                  onPress={onFinish}
                >
                  <Text style={styles.controlButtonText}>⏹ Finish</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // Minimized View
          <View style={styles.minimizedContent}>
            {/* Top Section: Current Affirmation */}
            <View style={styles.minimizedAffirmation}>
              <Text style={styles.minimizedAffirmationText} numberOfLines={2}>
                "{currentAffirmation}"
              </Text>
            </View>

            {/* Bottom Section: Stats */}
            <View style={styles.minimizedStats}>
              <View style={styles.minimizedStatItem}>
                <Text style={styles.minimizedStatValue}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.minimizedStatLabel}>Time</Text>
              </View>
              <View style={styles.minimizedStatItem}>
                <Text style={styles.minimizedStatValue}>
                  {currentSpeed > 0 ? currentSpeed.toFixed(1) : '---'}
                </Text>
                <Text style={styles.minimizedStatLabel}>Speed</Text>
              </View>
              <View style={styles.minimizedStatItem}>
                <Text style={styles.minimizedStatValue}>
                  {distance.toFixed(2)}
                </Text>
                <Text style={styles.minimizedStatLabel}>Distance</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  panelTouchable: {
    flex: 1,
    padding: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  // Expanded View Styles
  expandedContent: {
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FFC107',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  largeTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  affirmationSection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  affirmationText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statColumn: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: COLORS.primary,
  },
  finishButton: {
    backgroundColor: '#000',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  // Minimized View Styles
  minimizedContent: {
    flex: 1,
  },
  minimizedAffirmation: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 12,
  },
  minimizedAffirmationText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  minimizedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  minimizedStatItem: {
    alignItems: 'center',
  },
  minimizedStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  minimizedStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});


