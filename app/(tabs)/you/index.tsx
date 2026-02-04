import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import ProgressScreen from './progress';
import ActivitiesScreen from './activities';

export default function YouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'progress' | 'activities'>('progress');

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.navTitle}>You</Text>
        <View style={styles.navIcons}>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="person-circle-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="search-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
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
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  navTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  navIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconButton: {
    padding: 8,
  },
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.accent,
  },
  tabButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
});





