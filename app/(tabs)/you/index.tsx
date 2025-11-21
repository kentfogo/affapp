import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import ProgressScreen from './progress';
import ActivitiesScreen from './activities';

export default function YouScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'progress' | 'activities'>('progress');

  return (
    <View style={styles.container}>
      {/* Custom Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'progress' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('progress')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'progress' && styles.tabButtonTextActive,
            ]}
          >
            Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'activities' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('activities')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'activities' && styles.tabButtonTextActive,
            ]}
          >
            Activities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'progress' && <ProgressScreen />}
      {activeTab === 'activities' && <ActivitiesScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});




