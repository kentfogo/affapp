import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IntervalType, DistanceUnit } from '../types/session';

interface IntervalPickerProps {
  intervalType: IntervalType;
  timeInterval?: number;
  distanceInterval?: number;
  distanceUnit: DistanceUnit;
  onIntervalTypeChange: (type: IntervalType) => void;
  onTimeIntervalChange: (interval: number) => void;
  onDistanceIntervalChange: (interval: number) => void;
  onDistanceUnitChange: (unit: DistanceUnit) => void;
}

const TIME_PRESETS = [30, 60, 90, 120, 180, 300]; // seconds
const DISTANCE_PRESETS_MILES = [0.25, 0.5, 1.0, 1.5, 2.0];
const DISTANCE_PRESETS_KM = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0];

export default function IntervalPicker({
  intervalType,
  timeInterval = 60,
  distanceInterval = 0.5,
  distanceUnit,
  onIntervalTypeChange,
  onTimeIntervalChange,
  onDistanceIntervalChange,
  onDistanceUnitChange,
}: IntervalPickerProps) {
  const distancePresets =
    distanceUnit === 'miles' ? DISTANCE_PRESETS_MILES : DISTANCE_PRESETS_KM;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Interval Type</Text>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            intervalType === 'time' && styles.typeButtonActive,
          ]}
          onPress={() => onIntervalTypeChange('time')}
        >
          <Text
            style={[
              styles.typeButtonText,
              intervalType === 'time' && styles.typeButtonTextActive,
            ]}
          >
            Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            intervalType === 'distance' && styles.typeButtonActive,
          ]}
          onPress={() => onIntervalTypeChange('distance')}
        >
          <Text
            style={[
              styles.typeButtonText,
              intervalType === 'distance' && styles.typeButtonTextActive,
            ]}
          >
            Distance
          </Text>
        </TouchableOpacity>
      </View>

      {intervalType === 'time' && (
        <View style={styles.presets}>
          <Text style={styles.presetLabel}>Time Interval (seconds)</Text>
          <View style={styles.presetGrid}>
            {TIME_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  timeInterval === preset && styles.presetButtonActive,
                ]}
                onPress={() => onTimeIntervalChange(preset)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    timeInterval === preset && styles.presetButtonTextActive,
                  ]}
                >
                  {preset}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {intervalType === 'distance' && (
        <View style={styles.presets}>
          <View style={styles.distanceHeader}>
            <Text style={styles.presetLabel}>Distance Interval</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  distanceUnit === 'miles' && styles.unitButtonActive,
                ]}
                onPress={() => onDistanceUnitChange('miles')}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    distanceUnit === 'miles' && styles.unitButtonTextActive,
                  ]}
                >
                  mi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  distanceUnit === 'kilometers' && styles.unitButtonActive,
                ]}
                onPress={() => onDistanceUnitChange('kilometers')}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    distanceUnit === 'kilometers' && styles.unitButtonTextActive,
                  ]}
                >
                  km
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.presetGrid}>
            {distancePresets.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  distanceInterval === preset && styles.presetButtonActive,
                ]}
                onPress={() => onDistanceIntervalChange(preset)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    distanceInterval === preset && styles.presetButtonTextActive,
                  ]}
                >
                  {preset} {distanceUnit === 'miles' ? 'mi' : 'km'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  typeButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  presets: {
    marginTop: 8,
  },
  presetLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  unitButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  unitButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  presetButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  presetButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

