import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useSessionStore } from '../../store/sessionStore';
import SessionSettingsModal from '../../components/SessionSettingsModal';
import { SessionSettings, DistanceUnit } from '../../types/session';
import { storageService } from '../../services/storageService';
import { COLORS } from '../../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { data: onboardingData, updateOnboardingData } = useOnboardingStore();
  const { sessionSettings, setSessionSettings } = useSessionStore();
  const insets = useSafeAreaInsets();

  const [showSessionSettings, setShowSessionSettings] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const unitPreference = onboardingData?.unitPreference || 'miles';
  const isMetric = unitPreference === 'kilometers';

  const handleUnitChange = async (value: boolean) => {
    await Haptics.selectionAsync();
    const newUnit: DistanceUnit = value ? 'kilometers' : 'miles';
    await updateOnboardingData({ unitPreference: newUnit });
  };

  const handleSessionSettingsChange = async (settings: SessionSettings) => {
    setSessionSettings(settings);
    await storageService.saveSessionSettings(settings);
    setShowSessionSettings(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Are you sure?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      Alert.alert('Please confirm', 'You must check the confirmation box to delete your account.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (showDeleteAccount) {
    return (
      <View style={styles.container}>
        <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => setShowDeleteAccount(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Delete Account</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.deleteWarningContainer}>
            <Ionicons name="warning-outline" size={48} color="#E53935" />
            <Text style={styles.deleteTitle}>Delete Your Account</Text>
            <Text style={styles.deleteDescription}>
              Deleting your account will permanently remove all of your data, including:
            </Text>
            <View style={styles.deleteList}>
              <Text style={styles.deleteListItem}>• Your profile information</Text>
              <Text style={styles.deleteListItem}>• All session history and statistics</Text>
              <Text style={styles.deleteListItem}>• Your saved affirmations</Text>
              <Text style={styles.deleteListItem}>• All preferences and settings</Text>
            </View>
            <Text style={styles.deleteWarning}>
              This action cannot be undone.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmCheckbox}
            onPress={() => setDeleteConfirmed(!deleteConfirmed)}
          >
            <View style={[styles.checkbox, deleteConfirmed && styles.checkboxChecked]}>
              {deleteConfirmed && <Ionicons name="checkmark" size={16} color={COLORS.surface} />}
            </View>
            <Text style={styles.confirmText}>Yes, I want to delete my account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, !deleteConfirmed && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={!deleteConfirmed}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.navTitle}>Settings</Text>
        <View style={styles.navIcons}>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <Text style={styles.menuLabel}>Email</Text>
              <Text style={styles.menuValue}>{user?.email || 'Guest User'}</Text>
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.menuItem}>
              <Text style={styles.menuLabel}>Units of Measure</Text>
              <View style={styles.unitToggle}>
                <Text style={[styles.unitLabel, !isMetric && styles.unitLabelActive]}>Imperial</Text>
                <Switch
                  value={isMetric}
                  onValueChange={handleUnitChange}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
                />
                <Text style={[styles.unitLabel, isMetric && styles.unitLabelActive]}>Metric</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Session Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItemPressable}
              onPress={() => setShowSessionSettings(true)}
            >
              <Text style={styles.menuLabel}>Session Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItemPressable}
              onPress={() => setShowDeleteAccount(true)}
            >
              <Text style={styles.menuLabelDanger}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={20} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SessionSettingsModal
        visible={showSessionSettings}
        onClose={() => setShowSessionSettings(false)}
        onStartSession={handleSessionSettingsChange}
        initialSettings={sessionSettings || undefined}
        defaultDistanceUnit={onboardingData?.unitPreference || 'miles'}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuItemPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },
  menuLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  menuLabelDanger: {
    fontSize: 16,
    color: '#E53935',
  },
  menuValue: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  unitLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Delete Account Screen Styles
  deleteWarningContainer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  deleteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 16,
  },
  deleteDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteList: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  deleteListItem: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  deleteWarning: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
    textAlign: 'center',
  },
  confirmCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
