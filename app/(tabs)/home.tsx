import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../store/sessionStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { storageService } from '../../services/storageService';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedAffirmations, sessionSettings } = useSessionStore();
  const { data: onboardingData } = useOnboardingStore();

  useEffect(() => {
    // Load saved affirmations and settings
    const loadData = async () => {
      const affirmations = await storageService.getSelectedAffirmations();
      const settings = await storageService.getSessionSettings();
      useSessionStore.getState().setSelectedAffirmations(affirmations);
      if (settings) {
        useSessionStore.getState().setSessionSettings(settings);
      }
    };
    loadData();
  }, []);

  const handleStartSession = () => {
    if (selectedAffirmations.length < 5) {
      router.push('/(tabs)/library');
      return;
    }
    if (!sessionSettings) {
      // Default settings
      useSessionStore.getState().setSessionSettings({
        intervalType: 'time',
        timeInterval: 60,
        distanceUnit: onboardingData?.unitPreference || 'miles',
      });
    }
    router.push('/session');
  };

  const canStartSession =
    selectedAffirmations.length >= 5 && selectedAffirmations.length <= 10;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Journey</Text>
        <Text style={styles.subtitle}>Keep moving, keep growing</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ready to Start?</Text>
        <Text style={styles.cardText}>
          {selectedAffirmations.length === 0
            ? 'Select 5-10 affirmations to begin'
            : `You have ${selectedAffirmations.length} affirmations selected`}
        </Text>

        {!canStartSession && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/(tabs)/library')}
          >
            <Text style={styles.secondaryButtonText}>
              {selectedAffirmations.length === 0
                ? 'Choose Affirmations'
                : 'Manage Affirmations'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            !canStartSession && styles.buttonDisabled,
          ]}
          onPress={handleStartSession}
          disabled={!canStartSession}
        >
          <Text style={styles.buttonText}>Let's Go!</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {selectedAffirmations.length}
          </Text>
          <Text style={styles.statLabel}>Affirmations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {sessionSettings?.intervalType === 'time'
              ? `${sessionSettings.timeInterval}s`
              : sessionSettings?.distanceInterval
              ? `${sessionSettings.distanceInterval} ${sessionSettings.distanceUnit}`
              : '60s'}
          </Text>
          <Text style={styles.statLabel}>Interval</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
});

