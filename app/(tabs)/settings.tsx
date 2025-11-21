import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useSessionStore } from '../../store/sessionStore';
import IntervalPicker from '../../components/IntervalPicker';
import { SessionSettings } from '../../types/session';
import { storageService } from '../../services/storageService';
import { COLORS } from '../../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { data: onboardingData, reset: resetOnboarding } = useOnboardingStore();
  const { sessionSettings, setSessionSettings } = useSessionStore();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSettingsChange = async (newSettings: SessionSettings) => {
    setSessionSettings(newSettings);
    await storageService.saveSessionSettings(newSettings);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your onboarding preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Profile</Text>
          <Text style={styles.settingValue}>
            {user?.email || 'Guest User'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Settings</Text>
        <IntervalPicker
          intervalType={sessionSettings?.intervalType || 'time'}
          timeInterval={sessionSettings?.timeInterval || 60}
          distanceInterval={sessionSettings?.distanceInterval || 0.5}
          distanceUnit={sessionSettings?.distanceUnit || onboardingData?.unitPreference || 'miles'}
          onIntervalTypeChange={(type) =>
            handleSettingsChange({
              ...(sessionSettings || {}),
              intervalType: type,
            } as SessionSettings)
          }
          onTimeIntervalChange={(interval) =>
            handleSettingsChange({
              ...(sessionSettings || {}),
              intervalType: 'time',
              timeInterval: interval,
            } as SessionSettings)
          }
          onDistanceIntervalChange={(interval) =>
            handleSettingsChange({
              ...(sessionSettings || {}),
              intervalType: 'distance',
              distanceInterval: interval,
            } as SessionSettings)
          }
          onDistanceUnitChange={(unit) =>
            handleSettingsChange({
              ...(sessionSettings || {}),
              distanceUnit: unit,
            } as SessionSettings)
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity
          style={styles.settingButton}
          onPress={handleResetOnboarding}
        >
          <Text style={styles.settingButtonText}>Reset Onboarding</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 24,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  settingButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
});

